// src/pages/agent/MyShift.tsx
import { useParams, Link, useLocation  } from 'react-router-dom';
import { useFlights } from '../../services/FlightContext';
import { useState, useEffect } from 'react';

export default function MyShift() {
  const { agentId } = useParams();
  const { flights } = useFlights();

  const location = useLocation() as { state?: { highlightId?: string } };
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.highlightId) {
      setHighlightId(location.state.highlightId);
      const t = setTimeout(() => setHighlightId(null), 1600);
      return () => clearTimeout(t);
    }
  }, [location.state?.highlightId]);


  const mine = flights.filter(f => f.assignments.some(a => a.agentId === agentId));

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">My Shift</h2>

      {mine.length ? (
        mine.map(f => (
          <div id={f.id} key={f.id}  className={"bg-white p-3 rounded shadow mb-3 transition-all " +(highlightId === f.id ? "ring-2 ring-green-500 animate-pulse" : "")}>

            <h3 className="text-jet2 font-bold">{f.number} - {f.date}</h3>
            <p className="text-sm text-slate-600">{f.destination} – {f.schedTime}</p>

            
            <Link
              to={`/agent/${agentId}/flights/${f.id}`}
              className="inline-block mt-2 text-xs text-jet2 underline"
            >
              Update flight →
            </Link>
          </div>
        ))
      ) : (
        'No flights yet'
      )}
    </div>
  );
}
