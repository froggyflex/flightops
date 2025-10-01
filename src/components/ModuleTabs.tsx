import {useState}from'react';import PRMForm from'./PRMForm';import RemarkForm from'./RemarkForm';

export default({flight})=>{
  const tabs=['PRMs','Remarks'];
  const[a,sA]=useState(tabs[0]);

return(<>
  {/* add flex-col so each child starts on its own line */}
  
  <div className="flex flex-col gap-2">
    <div className="block h-0 w-full" />
    <div className="flex gap-2">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => sA(t)}
          className={
            a === t
              ? 'bg-jet2 text-white px-3 py-1'
              : 'bg-slate-200 px-3 py-1'
          }
        >
          {t}
        </button>
      ))}
    </div>
  </div>

  <div className="bg-white mt-3 p-3 rounded shadow">
    {a === 'PRMs' ? (
      <PRMForm flight={flight} />
    ) : (
      <RemarkForm flight={flight} />
    )}
  </div>
</>)
}
