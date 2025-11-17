export type Role = 'Arrival'|'Gate';

export interface Assignment{ 
    id:string; 
    agentId:string; 
    role:Role; 
}
export interface PRMData{ 
    WCHR?:number; 
    WCHS?:number; 
    WCHC?:number; 
    EMD?:number; 
    MAAS?:number; 
    DPNA?:number; 
    NUT?:number; 
}

export interface RemarkData{ 
    text?:string; 
}


export interface Flight{ 
    id:string; 
    number:string;
    destination:string; 
    schedTime:string; 
    date:string; 
    assignments:Assignment[]; 
    prms?:PRMData; 
    remarks?:RemarkData; 

      // NEW: per-agent logs
    agentOps?: Record<string, AgentOpsData>; // string = key = agentId
}
 
 
 
export interface AgentOpsData {
  gateStart?: string;      // "HH:MM"
  gateEnd?: string;        // "HH:MM"   ← NEW
  firstBus?: string;       // "HH:MM"
  lastBus?: string;        // "HH:MM"
  walkout?: boolean;
  prmPickup?: string;      // "HH:MM"
  paxString?: string;      // e.g. "189+1"
  paxBoarded?: number;
  infantsBoarded?: number;
  updatedBy: string;
  updatedAt: string;       // ISO

  
}
