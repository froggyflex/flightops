// pages/agent/AgentFlightDetail.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useFlights } from '../../services/FlightContext';
import { useState, useEffect } from 'react';
import TimeField from '../../components/TimeField';


export default function AgentFlightDetail() {
  const { agentId, flightId } = useParams();
  const { flights, updateAgentOps } = useFlights();
  const nav = useNavigate();

  

  const flight = flights.find(f => f.id === flightId);
  const existing = flight?.agentOps?.[agentId!] || {};

  const [gateStart, setGateStart] = useState<string>(existing.gateStart || "");
  const [gateEnd,   setGateEnd]   = useState<string>(existing.gateEnd   || "");
  const [firstBus,  setFirstBus]  = useState<string>(existing.firstBus  || "");
  const [lastBus,   setLastBus]   = useState<string>(existing.lastBus   || "");
  const [walkout,   setWalkout]   = useState<boolean>(!!existing.walkout);
  const [prmPickup, setPrmPickup] = useState<string>(existing.prmPickup || "");
  const [paxString, setPaxString] = useState<string>(existing.paxString || "");

  useEffect(() => {
    if (!flight) {
      // If flight missing (refresh, etc) 
      nav(`/agent/${agentId}`);
    }
  }, [flight, agentId, nav]);

  if (!flight) return null;

  const parsePax = (value: string) => {
    const match = value.match(/^(\d+)\s*\+\s*(\d+)$/);
    if (!match) return { paxBoarded: undefined, infantsBoarded: undefined };
    return {
      paxBoarded: Number(match[1]),
      infantsBoarded: Number(match[2]),
    };
  };

  const onSave = () => {
    const { paxBoarded, infantsBoarded } = parsePax(paxString);
    updateAgentOps(flight.id, agentId!, {
      gateStart: gateStart || undefined,
      firstBus: firstBus || undefined,
      lastBus: lastBus || undefined,
      walkout,
      prmPickup: prmPickup || undefined,
      paxString: paxString || undefined,
      paxBoarded,
      infantsBoarded,
    });
    nav(`/agent/${agentId}`, { state: { highlightId: flight.id } }); // go back to MyShift
  };

  return (
    <div className="max-w-md mx-auto">
      <header className="mb-4">
        <h2 className="text-xl font-bold text-jet2">{flight.number}</h2>
        <p className="text-sm text-slate-600">
          {flight.destination} — {flight.date} — {flight.schedTime}
        </p>
      </header>

      <div className="bg-white rounded shadow p-4 flex flex-col gap-3">

        <TimeField label="Gate start" value={gateStart} onChange={setGateStart} />

        <TimeField label="Gate end" value={gateEnd} onChange={setGateEnd} />
        {!(!gateStart || !gateEnd || gateEnd >= gateStart) && (
          <p className="text-xs text-orange-600 -mt-2">Gate end is before gate start.</p>
        )}

        <TimeField label="First bus" value={firstBus} onChange={setFirstBus} disabled={walkout} />
        <TimeField label="Last bus"  value={lastBus}  onChange={setLastBus}  disabled={walkout} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={walkout} onChange={e => setWalkout(e.target.checked)} />
          Walkout to aircraft (no buses)
        </label>

        <TimeField label="PRM pickup time" value={prmPickup} onChange={setPrmPickup} />

        <div className="flex flex-col text-sm">
          <label className="font-semibold mb-1">Boarded pax + infants</label>
          <input
            type="text"
            value={paxString}
            onChange={e => setPaxString(e.target.value)}
            placeholder="e.g. 189+1"
            className="border rounded p-2"
          />
          <p className="text-xs text-slate-500 mt-1">
            Format: passengers+infants (example: <span className="font-mono">189+1</span>)
          </p>
        </div>

        <button
          onClick={onSave}
          className="mt-4 bg-jet2 text-white py-2 rounded font-semibold"
        >
          Save
        </button>
      </div>
    </div>
  );
}
