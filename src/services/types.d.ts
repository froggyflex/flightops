export type Role = 'Arrival'|'Gate';
export interface Assignment{ id:string; agentId:string; role:Role; }
export interface PRMData{ WCHR?:number; WCHS?:number; WCHC?:number; EMD?:number; MAAS?:number; DPNA?:number; NUT?:number; }
export interface RemarkData{ text?:string; }
export interface Flight{ id:string; number:string; destination:string; schedTime:string; date:string; assignments:Assignment[]; prms?:PRMData; remarks?:RemarkData; }
