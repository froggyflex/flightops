import {useFlights}from'../services/FlightContext';export default function RemarkForm({flight}){
  const{updateFlight}=useFlights();const val=flight.remarks?.text||'';
  return(<textarea rows={4} className="w-full border p-2" value={val}
    onChange={e=>updateFlight(flight.id,{remarks:{text:e.target.value}})} placeholder="Notes..."/>)
}
