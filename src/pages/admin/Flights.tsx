import {useFlights}from'../../services/FlightContext';
import{useState} from'react';
import FlightTable from'../../components/FlightTable';
import { toJet2, fromJet2 } from '../../utils/ts';

export default function Flights(){
  
  const { flights, addFlight, addAssignment } = useFlights(); 
  const [selected, setSelected] = useState(() =>

    //todo: if possible add state that is equal to a previously searched value;
    toJet2(new Date().toISOString().slice(0, 10))
  );
  const[f,setF]=useState({number:'',destination:'',schedTime:''});

  /* ---------- SEED FUNCTION ---------- */
  const seedFlights = () => {
    const todayJet = toJet2(new Date().toISOString().slice(0, 10));

    const demo = [
      { number: 'LS123', destination: 'Manchester', schedTime: '06:45' },
      { number: 'LS456', destination: 'Edinburgh',  schedTime: '08:20' },
      { number: 'LS789', destination: 'Palma',      schedTime: '12:10' },
    ];

    demo.forEach(f => {
       addFlight({ ...f, date: todayJet});
        
       
    });

  };

  const seedAssignment = () => {

        flights.forEach(f => {
            addAssignment(f.id, { agentId: 'Emily',  role: 'Check in' });
            addAssignment(f.id, { agentId: 'Jon',  role: 'Gate' });
           
        });
  };
  /* ----------------------------------- */
  
  return(
  <div>
    <h2 className="text-2xl font-bold mb-4">Flights</h2>

    <div className="bg-white p-3 rounded shadow mb-4 flex gap-2">
      <input placeholder="Flight#" className="border p-1" value={f.number} onChange={e=>setF({...f,number:e.target.value})}/>

      <input placeholder="Destination" className="border p-1" value={f.destination} onChange={e=>setF({...f,destination:e.target.value})}/>

      <input placeholder="Date" className="border p-1" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/>

      <input type="time" className="border p-1" value={f.schedTime} onChange={e=>setF({...f,schedTime:e.target.value})}/>

      <button className="bg-jet2 text-white px-3" onClick={()=>{if(f.number)addFlight(f)}}>Add</button>


      {/* NEW seed button – show only in development */}
        
          <button
            className="bg-slate-500 text-white px-3 py-1 rounded ml-auto"
            onClick={seedFlights}
          >
            Seed flights
          </button>

                    <button
            className="bg-slate-500 text-white px-2 py-1 rounded ml-auto"
            onClick={seedAssignment}
          >
            Seed assignments
          </button>
       

    </div>
    
    <div className="flex items-center gap-4 mb-4">
      <label className="text-sm">
        Find a flight:
        <input
          type="date"
          className="border p-1 ml-2"
          value={fromJet2(selected)}
          onChange={e => setSelected(toJet2(e.target.value))}
        />
      </label>
    </div>


    <FlightTable flights={flights.filter(f => f.date === selected)} />

  </div>
    )
}
