import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useFlights } from "../../services/FlightContext";
import { sendOperationalItem } from "../../services/sharepointAdapter";
import TimeField  from "../../components/TimeField";
import GateConfirmModal  from "../../components/GateConfirmModal";

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
      setPushErr(e?.message || "Failed to send to SharePoint");
    } finally {
      setPushBusy(false);
    }
  };


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
    </div>
  );
}
