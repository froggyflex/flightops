import {useParams}from'react-router-dom';import{useFlights}from'../../services/FlightContext';
export default function MyShift(){const{agentId}=useParams();const{flights}=useFlights();
const mine=flights.filter(f=>f.assignments.some(a=>a.agentId===agentId));
return(<div>{mine.length?mine.map(f=>(<div key={f.id} className="bg-white p-3 rounded shadow mb-3">
<h3 className="text-jet2 font-bold">{f.number}</h3><p>{f.destination} – {f.schedTime}</p></div>)):'No flights yet'}</div>)}
