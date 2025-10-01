import {NavLink,Outlet}from'react-router-dom';




export default function AdminLayout(){


  
  return(<div className="flex min-h-screen">
    <aside className="w-70 bg-jet2 text-white flex flex-col">
      <div className="p-4 text-2xl font-bold">Jet2.com - AirportOps</div>
      {['dashboard','flights','agents','reports'].map(l=>(
        <NavLink key={l} to={`/admin/${l}`} className={({isActive})=>
          (isActive?'bg-jet2-dark':'hover:bg-jet2-dark')+' px-4 py-2 capitalize'}>{l}</NavLink>
      ))}
    </aside>
    <main className="flex-1 p-6"><Outlet/></main>
  </div>)
}
