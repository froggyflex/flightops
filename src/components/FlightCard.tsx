import{useState, useEffect} from'react';

export default function FlightCard({ flight }) {

  const useETA = (flightNo: string) => {
  const [eta, setEta] = useState<string | null>(null);

  useEffect(() => {
    // pseudo-fetch – requires your FR24 API key import.meta.env.VITE_FR24_KEY
    fetch(`https://fr24api.flightradar24.com/v1/flight/${flightNo}`, {
      headers: { 'x-api-key': "01977358-f773-70f8-8b91-9d190ce71dd8|D2m8xbz1FXDM0SXQ24arYJrG2t6lyrFNtiggJKL2a5b82233" }
    })
      .then(r => r.json())
      .then(json => setEta(json?.flight?.estimated_arrival))
      .catch(() => setEta(null));
  }, [flightNo]);

  return eta;
};

    
  const eta = "test";//useETA(flight.number);

  return (
    <div className="bg-white rounded shadow p-4 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-jet2">{flight.number}</span>
        <span className="text-sm text-slate-500">{flight.destination}</span>
      </div>

      <div className="text-sm">
        <span className="font-semibold">STD:</span> {flight.schedTime}
        {eta && (
          <>
            &nbsp;|&nbsp;<span className="font-semibold">ETA:</span>{' '}
            <span className="text-green-600">{eta}</span>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {flight.assignments.map(a => (
          <span
            key={a.id}
            className="bg-jet2/10 text-jet2-dark text-xs px-2 py-0.5 rounded"
          >
            {a.agentId} ({a.role})
          </span>
        ))}
        {flight.assignments.length === 0 && (
          <span className="text-xs text-slate-400">No agents yet</span>
        )}
      </div>

      <a
        href={`/admin/flights/${flight.id}`}
        className="mt-auto text-sm text-right text-jet2 underline"
      >
        Open detail →
      </a>
    </div>
  );
}