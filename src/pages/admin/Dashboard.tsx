import {useFlights}from'../../services/FlightContext';
import{useState} from'react';
import FlightTable from'../../components/FlightTable';
import FlightCard from'../../components/FlightCard';
import { toJet2, fromJet2 } from '../../utils/ts';

export default function Dashboard() {
  const { flights } = useFlights();
  const today = toJet2(new Date().toISOString().slice(0,10));
  const list  = flights.filter(f => f.date === today);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map(f => (
        <FlightCard   flight={f} />
      ))}
      {list.length === 0 && <p>No flights for today yet.</p>}
    </div>
  );
}