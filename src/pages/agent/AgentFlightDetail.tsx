import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useFlights } from "../../services/FlightContext";
import { sendOperationalItem } from "../../services/sharepointAdapter";
import TimeField  from "../../components/TimeField";
import GateConfirmModal  from "../../components/GateConfirmModal";
import { useSpeechCapture } from '../../services/voice/useSpeechCapture';

/* ---------- local types to keep TS happy (adjust if you already export them) ---------- */
type AgentOps = {
  gateStart?: string;
  gateEnd?: string;
  firstBus?: string;
  lastBus?: string;
  walkout?: boolean;
  prmPickup?: string;
  paxString?: string;
  paxBoarded?: number;
  infantsBoarded?: number;
  updatedAt?: string;
  updatedBy?: string;
};

type Assignment = { id: string; agentId: string; role: string };

type Flight = {
  id: string;
  number: string;
  destination: string;
  schedTime: string; // HH:MM
  date: string;      // DDMMMYY (e.g., 19NOV25)
  assignments: Assignment[];
  agentOps?: Record<string, AgentOps>;
  remarks?: string;
};

 

/* ---------- tiny helpers ---------- */
const nowHHMM = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export default function AgentFlightDetail() {


  const { agentId, flightId } = useParams<{ agentId: string; flightId: string }>();
  const { flights, updateAgentOps } = useFlights();
  const { active, listening, events, error, start, stop, clear } = useSpeechCapture('en-GB');
  const [reviewOpen, setReviewOpen] = useState(false);

function applyEvent(ev: {ts:number, raw:string, parsed:any}) {
  const p = ev.parsed;
  if (!p) return;
  if (p.kind === 'time') {
    const map: Record<string, [string|null, (v:string)=>void]> = {
      gateStart: [gateStart, setGateStart],
      gateEnd:   [gateEnd,   setGateEnd],
      firstBus:  [firstBus,  setFirstBus],
      lastBus:   [lastBus,   setLastBus],
      prmPickup: [prmPickup, setPrmPickup],
    } as any;

    const [prev, setter] = map[p.field];
    if (prev !== p.value) {
      setter(p.value); // overwrite silently
      addAudit({ ts: ev.ts, source:'voice', field: p.field, from: prev, to: p.value, phrase: ev.raw });
    }
  } else if (p.kind === 'flag' && p.field === 'walkout') {
    if (!walkout) addAudit({ ts: ev.ts, source:'voice', field:'walkout', from: walkout, to: true, phrase: ev.raw });
    setWalkout(true);
    // Clear bus times if we toggled to walkout
    if (firstBus) addAudit({ ts: ev.ts, source:'voice', field:'firstBus', from:firstBus, to:null, phrase: ev.raw });
    if (lastBus)  addAudit({ ts: ev.ts, source:'voice', field:'lastBus',  from:lastBus,  to:null, phrase: ev.raw });
    setFirstBus(''); setLastBus('');
  } else if (p.kind === 'remark') {
    const prev = remark || '';
    const next = prev ? `${prev}\n${p.text}` : p.text;
    if (next !== prev) {
      setRemark(next);
      addAudit({ ts: ev.ts, source:'voice', field:'remark', from: prev, to: next, phrase: ev.raw });
    }
  }
}
  // Find the flight
  const flight = useMemo<Flight | undefined>(
    () => flights.find((f: any) => String(f.id) === String(flightId)),
    [flights, flightId]
  );

  if (!flight || !agentId) {
    return (
      <div className="max-w-md mx-auto p-4">
        <p className="text-slate-600">Flight not found.</p>
        <Link to={`/agent/${agentId || ""}`} className="text-jet2 underline">
          ← Back to My Shift
        </Link>
      </div>
    );
  }

  const seedOps: AgentOps = flight.agentOps?.[agentId] || {};

  /* ----- local form state ----- */
  const [gateStart, setGateStart] = useState<string>(seedOps.gateStart || "");
  const [gateEnd, setGateEnd] = useState<string>(seedOps.gateEnd || "");
  const [firstBus, setFirstBus] = useState<string>(seedOps.firstBus || "");
  const [lastBus, setLastBus] = useState<string>(seedOps.lastBus || "");
  const [walkout, setWalkout] = useState<boolean>(!!seedOps.walkout);
  const [prmPickup, setPrmPickup] = useState<string>(seedOps.prmPickup || "");
  const [paxString, setPaxString] = useState<string>(seedOps.paxString || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // SharePoint push state
  const [gate, setGate] = useState("");
  const [remark, setRemark] = useState(""); // NEW
  const [showGate, setShowGate] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushOk, setPushOk] = useState<string | null>(null);
  const [pushErr, setPushErr] = useState<string | null>(null);

  const validOrder =
    !gateStart ||
    !gateEnd ||
    gateStart <= gateEnd; // simple validation if both present

  const onSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateAgentOps(flight.id, agentId, {
        gateStart: gateStart || undefined,
        gateEnd: gateEnd || undefined,
        firstBus: walkout ? undefined : firstBus || undefined,
        lastBus: walkout ? undefined : lastBus || undefined,
        walkout: walkout || undefined,
        prmPickup: prmPickup || undefined,
        paxString: paxString || undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: agentId,
      } as Partial<AgentOps>);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } finally {
      setSaving(false);
    }
  };

  // Build the comment string as requested
  const commentString = [
    `Gate ${gate || "—"}`,
    `start: ${gateStart || "—"}`,
    `end: ${gateEnd || "—"}`,
    `first bus: ${firstBus || (walkout ? "walkout" : "—")}`,
    `last bus: ${lastBus || (walkout ? "walkout" : "—")}`,
    `prm: ${prmPickup || "—"}`,
  ].join(", ");

  const onClickSend = () => {
    setPushErr(null);
    setShowGate(true);
  };

  const confirmSend = async () => {
    setShowGate(false);
    setPushBusy(true);
    setPushOk(null);
    setPushErr(null);
    try {
      await sendOperationalItem({
        fileId: (import.meta as any).env.VITE_GRAPH_FILE_ID, // set in env when you get access
        agentId,
        flight: {
          id: flight.id,
          number: flight.number,
          destination: flight.destination,
          schedTime: flight.schedTime,
          date: flight.date,
          remarks: flight.remarks,
        },
        ops: { gateStart, gateEnd, firstBus, lastBus, walkout, prmPickup, paxString },
        gate,
        remarks: remark?.trim() || undefined,   // this triggers the extra "info" row in the sheet,
      });

      setPushOk("Sent to SharePoint ✓");
      setTimeout(() => setPushOk(null), 2500);
    } catch (e: any) {
      const msg = String(e?.message || '');
        if (msg.includes('504') || msg.toLowerCase().includes('timeout')) {
          setPushErr('Sheets is slow right now. It may still have written. Please check the sheet or retry.');
        } else {
          setPushErr(msg || 'Failed to send');
        }
    } finally {
      setPushBusy(false);
    }
  };

  type Audit = {
    ts: number;
    source: 'voice'|'manual';
    field: 'gateStart'|'gateEnd'|'firstBus'|'lastBus'|'prmPickup'|'walkout'|'remark';
    from?: string|boolean|null;
    to?: string|boolean|null;
    phrase?: string;   // raw speech text
  };

  function loadAudit(flightId: string): Audit[] {
    try { return JSON.parse(localStorage.getItem(`audit:${flightId}`) || '[]'); } catch { return []; }
  }
  function saveAudit(flightId: string, items: Audit[]) {
    localStorage.setItem(`audit:${flightId}`, JSON.stringify(items));
  }

  const [audit, setAudit] = useState<Audit[]>(() => loadAudit(flight.id));

  function addAudit(entry: Audit) {
    setAudit(prev => {
      const next = [...prev, entry];
      saveAudit(flight.id, next);
      return next;
    });
  }
  function applyAll() { events.forEach(applyEvent); }
  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="mb-4">
        <Link to={`/agent/${agentId}`} className="text-jet2 underline text-sm">
          ← Back to My Shift
        </Link>
      </div>

      <h2 className="text-xl font-bold text-jet2 mb-1">{flight.number}</h2>
      <div className="text-sm text-slate-600 mb-4">
        {flight.destination} — {flight.date} — {flight.schedTime}
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        {!listening ? (
          <button onClick={start} className="px-3 py-1.5 rounded bg-jet2 text-white">🎤 Start voice</button>
        ) : (
          <button onClick={stop} className="px-3 py-1.5 rounded bg-slate-200">■ Stop</button>
        )}
        
        <button onClick={()=>setReviewOpen(true)} className="px-3 py-1.5 rounded bg-slate-100 border">
          Review voice log ({events.length})
        </button>
        <button onClick={()=>{applyAll(); clear();}} className="px-3 py-1.5 rounded bg-green-600 text-white">
          Apply all
        </button>
        <button onClick={clear} className="px-3 py-1.5 rounded bg-slate-100">Clear log</button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
      {/* capture tray */}
          {!!events.length && (
            <div className="bg-white rounded shadow p-3 mb-3 text-sm">
              <div className="font-semibold mb-2">Captured</div>
              <ul className="space-y-2">
                {events.slice(-6).reverse().map((e,idx)=>(
                  <li key={idx} className="flex items-center justify-between">
                    <span className="text-slate-600">{new Date(e.ts).toLocaleTimeString()} — “{e.raw}”</span>
                    <span>
                      {e.parsed?.kind==='time' && <span className="text-jet2">{e.parsed.field}: {e.parsed.value}</span>}
                      {e.parsed?.kind==='flag' && <span className="text-jet2">walkout</span>}
                      {e.parsed?.kind==='remark' && <span className="text-jet2">remark ✓</span>}
                      <button className="ml-3 text-blue-600 underline" onClick={()=>applyEvent(e)}>Apply</button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

      <div className="bg-white rounded shadow p-4 space-y-3">
        <TimeField label="Gate start" value={gateStart} onChange={setGateStart} />
        <TimeField
          label="Gate end"
          value={gateEnd}
          onChange={setGateEnd}
          disabled={!gateStart}
        />
        <TimeField
          label="First bus"
          value={firstBus}
          onChange={setFirstBus}
          disabled={walkout}
        />

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={walkout}
              onChange={(e) => setWalkout(e.target.checked)}
            />
            Walkout to aircraft (no buses)
          </label>
        </div>

        <TimeField
          label="Last bus"
          value={lastBus}
          onChange={setLastBus}
          disabled={walkout}
        />

        <TimeField
          label="PRM pickup time"
          value={prmPickup}
          onChange={setPrmPickup}
        />

        <label className="text-sm block">
          <span className="block font-semibold mb-1">Boarded pax + infants</span>
          <input
            type="text"
            value={paxString}
            onChange={(e) => setPaxString(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g. 189+1"
          />
          <span className="text-xs text-slate-500">
            Format: passengers+infants (example: 189+1)
          </span>
        </label>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onSave}
            disabled={!validOrder || saving}
            className={`py-2 px-4 rounded font-semibold text-white ${
              saved ? "bg-green-600" : saving ? "bg-slate-400" : "bg-jet2"
            }`}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </button>

          <button
            onClick={onClickSend}
            disabled={pushBusy}
            className="py-2 px-4 rounded font-semibold bg-slate-200 hover:bg-slate-300"
            title="Send this entry to the SharePoint spreadsheet"
          >
            {pushBusy ? "Sending…" : "Send to SharePoint"}
          </button>
        </div>

        {pushOk && <p className="text-green-700 text-sm mt-2">{pushOk}</p>}
        {pushErr && <p className="text-red-600 text-sm mt-2">{pushErr}</p>}

        {/* preview of the composed comment so agent can see what will be sent */}
        <div className="mt-3 text-xs text-slate-500">
          <span className="font-semibold">Preview comment: </span>
          {commentString}
        </div>
      </div>

      <GateConfirmModal
        open={showGate}
        gate={gate}
        remark={remark}
        onChangeGate={setGate}
        onChangeRemark={setRemark}
        onCancel={() => setShowGate(false)}
        onConfirm={confirmSend}
      />

       {/* review modal */}
      {reviewOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow p-5 w-[90%] max-w-lg">
            <h3 className="text-lg font-bold text-jet2 mb-3">Voice log for {flight.number}</h3>
            <div className="max-h-80 overflow-auto text-sm">
              {events.map((e,i)=>(
                <div key={i} className="py-1 border-b">
                  <div className="text-slate-500">{new Date(e.ts).toLocaleTimeString()}</div>
                  <div>“{e.raw}”</div>
                  {e.parsed && <div className="text-jet2">
                  {e.parsed?.kind==='time' && (
                    <span className="text-jet2">
                      {e.parsed.field}: {e.parsed.value}
                      {/* look up previous value from state on render to mark updated */}
                      {(e.parsed.field==='gateStart' && gateStart && gateStart!==e.parsed.value) && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          updated
                        </span>
                      )}
                    </span>
                  )}
                  </div>}
                  <button className="text-blue-600 underline mt-1" onClick={()=>applyEvent(e)}>Apply</button>
                </div>
              ))}
              
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Change log</h4>
              <div className="max-h-48 overflow-auto text-sm">
                {audit.map((a,i)=>(
                  <div key={i} className="py-1 border-b">
                    <div className="text-slate-500">{new Date(a.ts).toLocaleTimeString()} • {a.source}</div>
                    <div>
                      <span className="font-semibold">{a.field}</span>: {String(a.from ?? '—')} → <span className="text-jet2">{String(a.to ?? '—')}</span>
                      {a.phrase && <span className="ml-2 text-slate-500">“{a.phrase}”</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button className="px-3 py-2 rounded bg-slate-200" onClick={()=>setReviewOpen(false)}>Close</button>
              <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={()=>{applyAll(); setReviewOpen(false);}}>Apply all</button>
            </div>
          </div>
        </div>
      )}
    
    </div>
    
  );
}
