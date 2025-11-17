import React from'react';import ReactDOM from'react-dom/client';
import{BrowserRouter,Routes,Route}from'react-router-dom';
import{FlightProvider}from'./services/FlightContext';
import AdminLayout from'./layouts/AdminLayout';
import Dashboard from'./pages/admin/Dashboard';import Flights from'./pages/admin/Flights';
import FlightDetail from'./pages/admin/FlightDetail';import Agents from'./pages/admin/Agents';
import Reports from'./pages/admin/Reports';
import AgentFlightDetail from'./pages/agent/AgentFlightDetail';
import AgentLayout from'./layouts/AgentLayout';import MyShift from'./pages/agent/MyShift';
import Login from'./pages/Login';
import'./index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
  <FlightProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/admin" element={<AdminLayout/>}>
        <Route path="dashboard" element={<Dashboard/>}/>
        <Route path="flights" element={<Flights/>}/>
        <Route path="flights/:id" element={<FlightDetail/>}/>
        <Route path="agents" element={<Agents/>}/>
        <Route path="reports" element={<Reports/>}/>
        <Route index element={<Flights/>}/></Route>
        <Route path="/agent/:agentId" element={<AgentLayout/>}>
        <Route index element={<MyShift/>}/></Route>

        
        <Route path="/agent/:agentId" element={<AgentLayout />}>
           
          <Route index element={<MyShift />} />
          <Route path="flights/:flightId" element={<AgentFlightDetail />} /> 
          
        </Route>

      </Routes>
    </BrowserRouter>
  </FlightProvider>
</React.StrictMode>);
