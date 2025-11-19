import { Flight } from '../services/types.d';

export type SharePointRow = {
  Date: string;            // DDMMMYY
  FlightNo: string;        // LS123
  Destination: string;     // e.g. MAN
  STD: string;             // schedTime HH:MM
  Agent: string;           // agentId
  Role: string;            // CI / Gate / Turnaround
  GateStart?: string;
  GateEnd?: string;
  FirstBus?: string;
  LastBus?: string;
  Walkout?: 'Y'|'N';
  PRMPickup?: string;
  PaxString?: string;      // "189+1"
  PaxBoarded?: number;
  InfantsBoarded?: number;
};

export function toSharePointRows(flights: Flight[], dayJet2: string): SharePointRow[] {
  const rows: SharePointRow[] = [];
  for (const f of flights) {
    if (f.date !== dayJet2) continue;
    for (const a of f.assignments) {
      const ops = f.agentOps?.[a.agentId];
      rows.push({
        Date: dayJet2,
        FlightNo: f.number,
        Destination: f.destination,
        STD: f.schedTime,
        Agent: a.agentId,
        Role: a.role,
        GateStart: ops?.gateStart,
        GateEnd: ops?.gateEnd,
        FirstBus: ops?.firstBus,
        LastBus: ops?.lastBus,
        Walkout: ops?.walkout ? 'Y' : 'N',
        PRMPickup: ops?.prmPickup,
        PaxString: ops?.paxString,
        PaxBoarded: ops?.paxBoarded,
        InfantsBoarded: ops?.infantsBoarded,
      });
    }
  }
  return rows;
}

export function rowsToCSV(rows: SharePointRow[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]) as (keyof SharePointRow)[];
  const esc = (v: any) => (v === undefined || v === null) ? '' : String(v).replace(/"/g,'""');
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${esc(r[h])}"`).join(','))
  ];
  return lines.join('\n');
}
