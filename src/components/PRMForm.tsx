import {useFlights}from'../services/FlightContext';

export default function PRMForm({flight}){
  const{updateFlight}=useFlights();const cur=flight.prms||{};
  const fields=['WCHR','WCHS','WCHC','EMD','MAAS','DPNA','NUT'];
  const set=(k,v)=>updateFlight(flight.id,{prms:{...cur,[k]:v}});

  return( <div className="grid grid-cols-2 gap-3">{fields.map(f=>(<label key={f} className="text-sm flex flex-col">{f}
    <input type="number" min={0} value={cur[f]||''} onChange={e=>set(f,Number(e.target.value))} className="border p-1"/>
  </label>))}</div>)
}
