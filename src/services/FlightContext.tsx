import React,{createContext,useState,useContext}from'react';
import {Flight,Assignment,PRMData,RemarkData}from'./types.d';

interface Ctx{ flights:Flight[];
  addFlight:(f:Omit<Flight,'id'|'assignments'|'prms'|'remarks'>)=>void;
  updateFlight:(id:string,data:Partial<Flight>)=>void;
  addAssignment:(fid:string,a:Assignment)=>void; }

const Ctx=createContext<Ctx>(null!);
export const useFlights=()=>useContext(Ctx);

export const FlightProvider:React.FC<{children:React.ReactNode}>=({children})=>{
  const[f,setF]=useState<Flight[]>([]);
  
  const addFlight=fData=>setF(p=>[...p,{...fData,id:crypto.randomUUID(),assignments:[]}]);
  const updateFlight=(id,data)=>setF(p=>p.map(fl=>fl.id===id?{...fl,...data}:fl));
  const addAssignment=(id,a)=>setF(p=>p.map(fl=>fl.id===id?{...fl,assignments:[...fl.assignments,{...a,id:crypto.randomUUID()}]}:fl));


  return<Ctx.Provider value={{flights:f,addFlight,updateFlight,addAssignment}}>{children}</Ctx.Provider>
}
