import {useState}from'react';import{useNavigate}from'react-router-dom';
export default()=>{
  const nav=useNavigate();
  const[r,sR]=useState('admin');
  const[id,sId]=useState('agent1');

return(
<div className="h-screen flex items-center justify-center">
  <div className="bg-white p-6 rounded shadow"><h1 className="text-jet2 text-2xl mb-4">AirportOps</h1>

    <label className="block mb-2">Role:
      <select value={r}onChange={e=>sR(e.target.value)} className="border ml-2">
        <option value="admin">Admin</option><option value="agent">Agent</option>
      </select>
    </label>

    {r==='agent'&& 
    <label className="block mb-4">Agent ID:<input value={id}onChange={e=>sId(e.target.value)} className="border ml-2 p-1"/></label>}

    
    <button className="w-full bg-jet2 text-white py-1" onClick={()=>nav(r==='admin'?'/admin/flights':`/agent/${id}`)}>Enter</button>
  </div></div>
)}
