import React,{createContext,useState,useContext, useEffect}from'react';
import {Flight,Assignment,PRMData,RemarkData, AgentOpsData}from'./types.d';

interface Ctx{ flights:Flight[];

  addFlight:(f:Omit<Flight,'id'|'assignments'|'prms'|'remarks'>)=>void;
  updateFlight:(id:string,data:Partial<Flight>)=>void;
  addAssignment:(fid:string,a:Assignment)=>void;

  updateAgentOps: (fid: string, agentId: string, data: Partial<AgentOpsData>) => void;  // NEW

}
  

const Ctx=createContext<Ctx>(null!);
export const useFlights=()=>useContext(Ctx);

export const FlightProvider:React.FC<{children:React.ReactNode}>=({children})=>{

  const[f,setF] = useState<Flight[]>(() => {
  try {
    const raw = localStorage.getItem('flightops/flights');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
});
  
  
  const addFlight: Ctx['addFlight'] = (fData) => {
    const id = crypto.randomUUID();
    
    setF(prev => [...prev, { ...fData, id, assignments: [], prms: undefined, remarks: undefined, agentOps: {} }]);
    
    return id;
  };


  const updateFlight=(id,data)=>setF(p=>p.map(fl=>fl.id===id?{...fl,...data}:fl));

  const addAssignment=(id,a)=>setF(p=>p.map(fl=>fl.id===id?{...fl,assignments:[...fl.assignments,{...a,id:crypto.randomUUID()}]}:fl));

  const updateAgentOps = (fid: string, agentId: string, data: Partial<AgentOpsData>) => {
  setF(prev =>
    prev.map(fl => {
      if (fl.id !== fid) return fl;

      const currentOps = fl.agentOps ?? {};
      const previous    = currentOps[agentId] ?? {
        updatedBy: agentId,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...fl,
        agentOps: {
          ...currentOps,
          [agentId]: {
            ...previous,
            ...data,
            updatedBy: agentId,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }),
  );
};

 // HYDRATE from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem('flightops/flights');
    if (raw) {
      try { setF(JSON.parse(raw)); } catch {}
    }
  }, []);

  // PERSIST on every change
  useEffect(() => {
    localStorage.setItem('flightops/flights', JSON.stringify(f));
  }, [f]);

  // SYNC when another tab updates localStorage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'flightops/flights' && e.newValue) {
        try { setF(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);


  return<Ctx.Provider value={{flights:f,addFlight,updateFlight,addAssignment, updateAgentOps}}>{children}</Ctx.Provider>
}
