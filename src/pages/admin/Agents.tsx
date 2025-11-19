// src/pages/admin/Agents.tsx
import { useMemo, useState } from 'react';
import { useFlights } from '../../services/FlightContext';
import { fromJet2, toJet2 } from '../../utils/ts';

import { Link } from 'react-router-dom';


type Progress = {
  totalFields: number;
  completed: number;
  fields: Record<string, boolean>;
};

function computeProgress(agentId: string, flight: any): Progress {
  // agentOps keyed by agentId
  const ops = flight.agentOps?.[agentId] ?? {};
  // Required fields for progress
  const checklist = {
    gateStart: !!ops.gateStart,
    gateEnd: !!ops.gateEnd,
    firstBus: !!ops.firstBus || !!ops.walkout, // walkout counts as no-bus flow
    lastBus: !!ops.lastBus || !!ops.walkout,
    prmPickup: !!ops.prmPickup,
    paxString: !!ops.paxString,
  };
  const fields = Object.keys(checklist);
  const completed = fields.reduce((n, k) => n + (checklist[k as keyof typeof checklist] ? 1 : 0), 0);
  return { totalFields: fields.length, completed, fields: checklist };
}

export default function Agents() {
  const { flights } = useFlights();

  // Date filter (default: today)
  const [selected, setSelected] = useState(() =>
    toJet2(new Date().toISOString().slice(0, 10))
  );

  // Build a roster: agentId -> { flights: [{flight, role, progress}] }
  const roster = useMemo(() => {
    const todayFlights = flights.filter(f => f.date === selected);
    const byAgent: Record<string, { flights: Array<{ flight: any; role: string; progress: Progress }> }> = {};
    for (const f of todayFlights) {
      for (const a of f.assignments) {
        const progress = computeProgress(a.agentId, f);
        (byAgent[a.agentId] ||= { flights: [] }).flights.push({
          flight: f,
          role: a.role,
          progress,
        });
      }
    }
    return byAgent;
  }, [flights, selected]);

  const agentIds = Object.keys(roster).sort();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Agents on duty</h2>
        <label className="text-sm">
          Date:&nbsp;
          <input
            type="date"
            value={fromJet2(selected)}
            onChange={e => setSelected(toJet2(e.target.value))}
            className="border p-1 rounded"
          />
        </label>
      </div>

      {!agentIds.length && (
        <p className="text-slate-500">No assignments for the selected date.</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentIds.map(id => {
          const items = roster[id].flights;

          // Agent-level progress (avg of flights)
          const total = items.reduce((n, x) => n + x.progress.totalFields, 0) || 1;
          const done  = items.reduce((n, x) => n + x.progress.completed, 0);
          const pct   = Math.round((done / total) * 100);

          return (
            <div key={id} className="bg-white rounded shadow p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{id}</h3>
                <span className="text-xs text-slate-500">{items.length} flight(s)</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 rounded overflow-hidden mb-3">
                <div
                  className="h-full bg-jet2"
                  style={{ width: `${pct}%` }}
                  aria-label={`Progress ${pct}%`}
                />
              </div>
              <div className="text-xs text-slate-600 mb-3">Overall progress: {pct}%</div>

              {/* Flight chips */}
              <div className="flex flex-col gap-3">
                {items.map(({ flight, role, progress }) => (
                  <div key={flight.id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-jet2">{flight.number}</div>
                      <span className="text-xs bg-jet2/10 text-jet2 px-2 py-0.5 rounded">
                        {role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {flight.destination} — {flight.schedTime}
                    </div>

                    {/* Per-flight progress row */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-full h-1.5 bg-slate-200 rounded overflow-hidden">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${Math.round((progress.completed / progress.totalFields) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {progress.completed}/{progress.totalFields}
                      </span>
                    </div>

                    {/* Checklist icons */}
                    <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-slate-600">
                      {Object.entries(progress.fields).map(([k, ok]) => (
                        <div key={k} className="flex items-center gap-1">
                          <svg viewBox="0 0 20 20" className={`w-3 h-3 ${ok ? 'text-green-600' : 'text-slate-300'}`} fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 10.435a1 1 0 111.414-1.414l3.017 3.017 6.657-6.657a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          <span className={ok ? '' : 'line-through opacity-60'}>{k}</span>
                        </div>
                      ))}
                    </div>

                   <Link to={`/admin/flights/${flight.id}`} className="text-xs text-jet2 underline">
                        Open flight →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
