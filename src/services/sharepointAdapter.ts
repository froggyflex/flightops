// src/services/sharepointAdapter.ts
/**
 * Pluggable adapter to send an "Operational Items" row to the SharePoint Excel.
 * - Validates month/year by reading F18:G19 (month) and F20:G21 (year)
 * - Selects the day tab (e.g., "19")
 * - Finds the next free row starting from 87 in column B
 * - Writes: B=Task, C:D=Boarding, E=FlightNo, H=Agent, M:AC=Comment
 * - Optionally writes a second row for remarks with B=info
 *
 * For now you can:
 *  - set VITE_GRAPH_TOKEN (a temporary Graph Explorer token) and VITE_GRAPH_FILE_ID (driveItem id), or
 *  - leave token undefined to store the payload in localStorage "queuedSharePointSubmissions"
 */

type Ops = {
  gateStart?: string;
  gateEnd?: string;
  firstBus?: string;
  lastBus?: string;
  walkout?: boolean;
  prmPickup?: string;
  paxString?: string;
};

type Flight = {
  id: string;
  number: string;           // e.g., LS123
  destination: string;      // e.g., MAN
  schedTime: string;        // HH:MM
  date: string;             // DDMMMYY, e.g., 19NOV25
  remarks?: string;
};

type Payload = {
  fileId?: string;          // Graph driveItem id of the file (recommended)
  filePath?: string;        // alternative: path under a drive
  agentId: string;
  flight: Flight;
  ops: Ops;
  gate: string;
  remarks?: string;
};

const GRAPH = "https://graph.microsoft.com/v1.0";

// Config you might eventually move to .env
const CONFIG = {
  // If your month/year live in a dedicated worksheet (e.g., 'TEMPLATE'), set it here.
  // If not, we’ll read them from the day tab itself.
  MONTH_YEAR_SHEET: "TEMPLATE", // change to the correct sheet or leave as undefined
  MONTH_RANGE: "F18:G19",
  YEAR_RANGE: "F20:G21",
  START_ROW: 87, // Operational Items table starts here
  START_COL_LETTER: "B",
  END_COL_LETTER: "AC",
};

/** Utilities */
const toDayNumber = (jet2Date: string) => parseInt(jet2Date.slice(0, 2), 10);
const monthFromJet2 = (jet2Date: string) => jet2Date.slice(2, 5).toUpperCase(); // NOV
const yearFromJet2 = (jet2Date: string) => "20" + jet2Date.slice(5); // "2025"

function colSpanArray(): string[] {
  // B..AC inclusive (28 columns)
  const letters = [
    "B","C","D","E","F","G","H","I","J","K","L",
    "M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","AA","AB","AC"
  ];
  return letters;
}

function buildComment(ops: Ops, gate: string): string {
  const seg = (label: string, val?: string | boolean, asWalkout=false) =>
    `${label}: ${val ? String(val) : (asWalkout ? "walkout" : "—")}`;

  return [
    `Gate ${gate || "—"}`,
    seg("start", ops.gateStart),
    seg("end", ops.gateEnd),
    seg("first bus", ops.firstBus, !!ops.walkout && !ops.firstBus),
    seg("last bus", ops.lastBus, !!ops.walkout && !ops.lastBus),
    seg("prm", ops.prmPickup)
  ].join(", ");
}

function buildRow({ flight, agentId, ops, gate }: { flight: Flight; agentId: string; ops: Ops; gate: string }) {
  const cols = colSpanArray();
  const row: any[] = new Array(cols.length).fill("");
  // Map known cells
  row[0] = "Task";                // B - Item
  row[1] = "Boarding";            // C - Area (part 1)
  row[2] = "Boarding";            // D - Area (part 2)
  row[3] = flight.number;         // E - Flight
  // F,G left blank
  row[6] = agentId;               // H - Agent
  // I..L blank
  row[11] = buildComment(ops, gate); // M - Comment (we put whole string there)
  // N..AC remain empty unless you want to spread across columns
  return row;
}

function buildRemarksRow({ remarks }: { remarks?: string }) {
  if (!remarks) return null;
  const cols = colSpanArray();
  const row: any[] = new Array(cols.length).fill("");
  row[0] = "info";        // B
  row[1] = "Boarding";    // C
  row[2] = "Boarding";    // D
  row[11] = remarks;      // M (Comments)
  return row;
}

/** Entry point you call from the UI */
export async function sendOperationalItem(payload: any) {
  const sheetsUrl = (import.meta as any).env.VITE_SHEETS_ENDPOINT?.trim();
  if (sheetsUrl) {
    const r = await fetch(sheetsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j?.error || `Sheets push failed: ${r.status}`);
    return;
  }

  // else: SharePoint/Graph path (as you had)
  const token = (import.meta as any).env.VITE_GRAPH_TOKEN?.trim();
  if (!token) {
    const qKey = "queuedSharePointSubmissions";
    const existing = JSON.parse(localStorage.getItem(qKey) || "[]");
    existing.push({ when: new Date().toISOString(), payload });
    localStorage.setItem(qKey, JSON.stringify(existing));
    return;
  }
  // Real path
  await sendViaGraph(payload, token);
}

/** --- Real Graph write path --- */
async function sendViaGraph(payload: Payload, token: string) {
  const { fileId, agentId, flight, ops, gate, remarks } = payload;
  if (!fileId) throw new Error("Missing VITE_GRAPH_FILE_ID (driveItem id).");

  // 1) Determine tab name = day number
  const dayTab = String(toDayNumber(flight.date)); // e.g., "19"

  // 2) te (optional but requested)
  //    If you have a dedicated sheet for month/year, use CONFIG.MONTH_YEAR_SHEET; else use dayTab.
  const metaSheet = CONFIG.MONTH_YEAR_SHEET || dayTab;
  const monthVals = await graphGetRange(fileId, metaSheet, CONFIG.MONTH_RANGE, token);
  const yearVals  = await graphGetRange(fileId, metaSheet, CONFIG.YEAR_RANGE, token);

  const monthInSheet = (monthVals?.values?.flat()?.join(" ") || "").toUpperCase();
  const yearInSheet  = (yearVals?.values?.flat()?.join(" ") || "");
  const wantedMonth  = monthFromJet2(flight.date);
  const wantedYear   = yearFromJet2(flight.date);

  if (!monthInSheet.includes(wantedMonth) || !yearInSheet.includes(wantedYear)) {
    throw new Error(`Month/Year mismatch: sheet says "${monthInSheet} ${yearInSheet}", entry is ${wantedMonth} ${wantedYear}`);
  }

  // 3) Find next empty row from START_ROW down, by scanning column B
  const scan = await graphGetRange(fileId, dayTab, `B${CONFIG.START_ROW}:B2000`, token);
  const arr: any[] = scan?.values || [];
  let nextRow = CONFIG.START_ROW;
  for (let i = 0; i < 2000 - CONFIG.START_ROW + 1; i++) {
    const val = arr[i]?.[0];
    if (!val || String(val).trim() === "") {
      nextRow = CONFIG.START_ROW + i;
      break;
    }
  }

  // 4) Build rows
  const mainRow = buildRow({ flight, agentId, ops, gate });
  const remarkRow = buildRemarksRow({ remarks });

  // 5) Write main row
  await graphWriteRow(fileId, dayTab, nextRow, mainRow, token);

  // 6) Optional second row for remarks
  if (remarkRow) {
    await graphWriteRow(fileId, dayTab, nextRow + 1, remarkRow, token);
  }
}

/** Graph helpers */
async function graphGetRange(fileId: string, sheet: string, address: string, token: string) {
  const url = `${GRAPH}/drives/${fileId}/workbook/worksheets('${encodeURIComponent(sheet)}')/range(address='${address}')`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
  if (!r.ok) throw new Error(`GET range ${sheet}!${address} → ${r.status}`);
  return r.json();
}

async function graphWriteRow(fileId: string, sheet: string, rowNumber: number, rowValues: any[], token: string) {
  const addr = `B${rowNumber}:${CONFIG.END_COL_LETTER}${rowNumber}`;
  const url = `${GRAPH}/drives/${fileId}/workbook/worksheets('${encodeURIComponent(sheet)}')/range(address='${addr}')`;
  const body = JSON.stringify({ values: [ rowValues ]});
  const r = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PATCH ${sheet}!${addr} failed: ${r.status} ${t}`);
  }
}

