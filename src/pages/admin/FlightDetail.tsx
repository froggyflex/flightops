import {useParams} from'react-router-dom';
import{useFlights} from'../../services/FlightContext';
import AssignAgentForm from'../../components/AssignAgentForm';
import ModuleTabs from'../../components/ModuleTabs';
import { toJet2, fromJet2 } from '../../utils/ts';

export default function FlightDetail(){
  const{id}=useParams();
  const{flights}=useFlights();
  const f=flights.find(x=>x.id===id);
   

if(!f) return<div>Not found</div>;
return(
<div>
  <h2 className="text-3xl font-bold text-jet2 mb-2">{f.number}</h2><p>{f.destination} – {f.schedTime} – {f.date}</p>
  <h3 className="mt-4 font-semibold">Assignments</h3>

  <ul className="list-disc ml-6">{f.assignments.map(a=><li key={a.id}>{a.agentId} ({a.role})</li>)}</ul>


  <AssignAgentForm flight={f}/>
  <ModuleTabs flight={f}/>
</div>)}
