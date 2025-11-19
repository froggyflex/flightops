// src/pages/admin/Dashboard.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFlights } from "../../services/FlightContext";
import { fromJet2, toJet2 } from "../../utils/ts";
import { rowsToCSV, toSharePointRows } from "../../utils/sharepoint";
import { useLiveTimes } from "../../utils/useLiveTimes";

export default function Dashboard() {
  const { flights } = useFlights();
  const [day, setDay] = useState(() => toJet2(new Date().toISOString().slice(0, 10)));
  const [query, setQuery] = useState("");
  const [withProgressOnly, setWithProgressOnly] = useState(false);

  // Today's flights (by selected day)
  const dayFlights = useMemo(
    () => flights.filter((f) => f.date === day),
    [flights, day]
  );

  // Text filter (flight number, destination, agent id)
  const filteredFlights = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = !q
      ? dayFlights
      : dayFlights.filter((f) => {
          const inNum = f.number.toLowerCase().includes(q);
          const inDest = f.destination.toLowerCase().includes(q);
          const inAgents = f.assignments.some((a) =>
            a.agentId.toLowerCase().includes(q)
          );
          return inNum || inDest || inAgents;
        });

    if (!withProgressOnly) return base;
    return base.filter((f) =>
      f.assignments.some((a) => {
        const ops = f.agentOps?.[a.agentId];
        return !!(ops?.gateStart || ops?.gateEnd || ops?.firstBus || ops?.paxString);
      })
    );
  }, [dayFlights, query, withProgressOnly]);

  // Agents on duty (assigned today)
  const agentsOnDuty = useMemo(() => {
    const s = new Set<string>();
    dayFlights.forEach((f) => f.assignments.forEach((a) => s.add(a.agentId)));
    return Array.from(s).sort();
  }, [dayFlights]);

  // Export-ready rows/CSV
  const rows = useMemo(() => toSharePointRows(flights, day), [flights, day]);
  const csv = useMemo(() => rowsToCSV(rows), [rows]);

  const copyCSV = async () => {
    if (!csv) return;
    await navigator.clipboard?.writeText(csv);
    alert("CSV copied to clipboard");
  };

  const downloadCSV = () => {
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${day}_flightops_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPI helpers
  const totalAssignments = dayFlights.reduce((n, f) => n + f.assignments.length, 0);
  const withProgress = dayFlights.reduce((n, f) => {
    return (
      n +
      f.assignments.filter((a) => {
        const ops = f.agentOps?.[a.agentId];
        return !!(ops?.gateStart || ops?.paxString || ops?.firstBus || ops?.gateEnd);
      }).length
    );
  }, 0);
  const progressPct = totalAssignments
    ? Math.round((withProgress / totalAssignments) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">
            Date:&nbsp;
            <input
              type="date"
              value={fromJet2(day)}
              onChange={(e) => setDay(toJet2(e.target.value))}
              className="border p-1 rounded"
            />
          </label>

          <input
            type="search"
            placeholder="Search flight, destination, agent…"
            className="border p-1 rounded md:w-64"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button
            className={`px-2 py-1 rounded text-xs ${
              withProgressOnly ? "bg-jet2 text-white" : "bg-slate-200"
            }`}
            onClick={() => setWithProgressOnly((v) => !v)}
            title="Show flights with any recorded progress"
          >
            With progress
          </button>

          {/* Quick nav */}
          <div className="hidden md:flex gap-2 ml-2">
            <Link to="/admin/flights" className="bg-jet2 text-white px-3 py-1 rounded">
              Flights
            </Link>
            <Link to="/admin/agents" className="bg-slate-200 px-3 py-1 rounded">
              Agents
            </Link>
            <Link to="/admin/reports" className="bg-slate-200 px-3 py-1 rounded">
              Reports
            </Link>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Flights today" value={dayFlights.length} />
        <KPI title="Agents on duty" value={agentsOnDuty.length} />
        <KPI title="Assignments" value={totalAssignments} />
        <KPI title="Progress" value={`${progressPct}%`} />
      </div>

      {/* Flights grid */}
      <section>
        <h3 className="font-semibold mb-2">Today’s flights</h3>
        {filteredFlights.length === 0 ? (
          <p className="text-slate-500">No flights for selected filters.</p>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFlights.map((f) => (
                <div key={f.id}>
                  <FlightCard flight={f} />
                </div>
            ))}
          </div>
        )}
      </section>

      {/* Agents on duty list */}
      <section>
        <h3 className="font-semibold mb-2">Agents on duty</h3>
        {agentsOnDuty.length === 0 ? (
          <p className="text-slate-500">No agents assigned for this date.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {agentsOnDuty.map((id) => (
              <span key={id} className="bg-white rounded shadow px-3 py-1 text-sm">
                {id}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Export-ready section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Export-ready data (Excel)</h3>
          <div className="flex gap-2">
            <button onClick={copyCSV} className="bg-slate-200 px-3 py-1 rounded">
              Copy CSV
            </button>
            <button onClick={downloadCSV} className="bg-jet2 text-white px-3 py-1 rounded">
              Download CSV
            </button>
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="text-slate-500">No rows for this date.</p>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    {Object.keys(rows[0]).map((h) => (
                      <th key={h} className="px-2 py-1 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      {Object.values(r).map((v, j) => (
                        <td key={j} className="px-2 py-1">
                          {String(v ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t p-2 text-xs text-slate-500">
              {rows.length} row(s) • Ready to paste into SharePoint/Excel import sheet
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* ----------- helpers / inner components ----------- */

function KPI({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function FlightCard({ flight }: { flight: any }) {
  // Use the live-times hook (mock now; swap to real API later)
  const live = useLiveTimes({ flightNo: flight.number, pollMs: 60000 });

  return (
    <div className="bg-white rounded shadow p-4 flex flex-col gap-2">
      <div className="flex justify-between">
        <div className="text-xl font-bold text-jet2">{flight.number}</div>
        <div className="text-sm text-slate-500">{flight.destination}</div>
      </div>

      <div className="text-sm flex flex-wrap gap-2 items-center">
        <span>
          <span className="font-semibold">STD:</span> {flight.schedTime}
        </span>
        {live.loading ? (
          <span className="text-xs text-slate-400">Fetching live…</span>
        ) : live.error ? (
          <span className="text-xs text-orange-600">Live N/A</span>
        ) : (
          <>
            {live.etd && (
              <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">
                ETD {live.etd}
              </span>
            )}
            {live.eta && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                ETA {live.eta}
              </span>
            )}
          </>
        )}
      </div>

      {/* Agents assigned (chips) */}
      <div className="flex flex-wrap gap-1">
        {flight.assignments.length ? (
          flight.assignments.map((a: any) => (
            <span
              key={a.id}
              className="text-xs bg-jet2/10 text-jet2 px-2 py-0.5 rounded"
            >
              {a.agentId} ({a.role})
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400">No agents yet</span>
        )}
      </div>

      <div className="mt-2">
        <Link to={`/admin/flights/${flight.id}`} className="text-sm text-jet2 underline">
          Open detail →
        </Link>
      </div>
    </div>
  );
}
