import {Link} from'react-router-dom';
import{Flight}from'../services/types.d';

export default({flights}:{flights:Flight[]})=>(


  
<table className="w-full bg-white shadow rounded">
  <thead>
    <tr className="bg-slate-200">
      <th className="p-2 text-left">Flight</th>
      <th className="p-2">Destination</th>
      <th className="p-2">Date</th>
      <th className="p-2">ETA</th>
      <th className="p-2">Agent(s) </th>
    </tr>
  </thead>
  <tbody>
    {flights.map(f=>(<tr key={f.id} className="border-t hover:bg-slate-50">
    <td className="p-2 text-jet2 font-semibold"><Link to={`/admin/flights/${f.id}`}>{f.number}</Link></td>
    
    <td className="p-2 text-center">{f.destination}</td>
    <td className="p-2 text-center">{f.date}</td>
    <td className="p-2 text-center">{f.schedTime}</td>
    <td className="p-2 text-center">{f.assignments.map(a=>a.agentId).join(', ')||'—'}</td>
  </tr>))}
  </tbody>

</table>)
