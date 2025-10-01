import {useState} from'react';
import{useFlights} from'../services/FlightContext';

export default function AssignAgentForm({flight}){
  const{addAssignment}=useFlights();
  const[a,setA]=useState('');
  const[role,setR]=useState('Arrival');

  return(
    <div className="flex gap-2 items-end">
      <input placeholder="Agent ID" className="border p-1" value={a}onChange={e=>setA(e.target.value)}/>
      <select value={role}onChange={e=>setR(e.target.value)} className="border p-1">
       {['Arrival','Gate'].map(r=><option key={r}>{r}</option>)}
       </select>
       
    <button className="bg-jet2 text-white px-3" onClick={()=>{if(a)addAssignment(flight.id,{agentId:a,role});setA('');}}>Add</button></div>)
}
