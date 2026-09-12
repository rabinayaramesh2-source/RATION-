import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Simulator from "./pages/Simulator";
import MachinePage from "./pages/Machine";

function Shell() {
  return <div className="shell">
    <aside><div className="brand">SRD<span>•</span></div><nav><Link to="/">Overview</Link><Link to="/simulator">Simulator</Link><Link to="/machine">Machine</Link></nav><div className="side-note">Firebase realtime<br/>3D telemetry</div></aside>
    <Routes><Route path="/" element={<Dashboard/>}/><Route path="/simulator" element={<Simulator/>}/><Route path="/machine" element={<MachinePage/>}/></Routes>
  </div>;
}

export default function App(){ return <BrowserRouter><Shell/></BrowserRouter>; }
