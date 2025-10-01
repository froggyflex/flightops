import{Outlet,useParams}from'react-router-dom';
export default function AgentLayout(){
  const{agentId}=useParams();
  return(<div className="min-h-screen flex flex-col">
    <header className="bg-jet2 text-white p-3 flex justify-between"><span>My Shift</span><span>{agentId}</span></header>
    <main className="flex-1 p-3"><Outlet/></main>
  </div>)
}
