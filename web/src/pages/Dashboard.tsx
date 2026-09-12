import { useEffect, useState } from "react";
import { Wifi, BatteryCharging, PackageCheck, AlertTriangle } from "lucide-react";
import { Hopper3D } from "../components/Hopper3D";
import { ThreeDMachine } from "../components/ThreeDMachine";
import { listenHoppers, listenMachine, listenTransactions, DEFAULT_HOPPERS, DEFAULT_MACHINE } from "../store";
import type { Hopper, Machine, Transaction } from "../types";

export default function Dashboard() {
  const [hoppers,setHoppers]=useState<Hopper[]>(DEFAULT_HOPPERS);
  const [machine,setMachine]=useState<Machine>(DEFAULT_MACHINE);
  const [transactions,setTransactions]=useState<Transaction[]>([]);
  useEffect(()=>listenHoppers(setHoppers),[]);
  useEffect(()=>listenMachine(setMachine),[]);
  useEffect(()=>listenTransactions(setTransactions),[]);

  return <main className="page">
    <header className="topbar">
      <div><div className="eyebrow">SMART RATION DISPENSER</div><h1>Command Center</h1><p>Hardware-connected live inventory and dispensing monitor</p></div>
      <div className="status-pill"><span className="dot"/> {machine.online ? "ESP32 ONLINE" : "OFFLINE"}</div>
    </header>

    <section className="metrics">
      <div className="metric"><Wifi size={19}/><span>WiFi</span><b>{machine.wifiRssi} dBm</b></div>
      <div className="metric"><BatteryCharging size={19}/><span>Battery</span><b>{machine.batteryPercent}%</b></div>
      <div className="metric"><PackageCheck size={19}/><span>Machine</span><b>{machine.machineAvailable ? "Available" : "Busy"}</b></div>
      <div className="metric"><AlertTriangle size={19}/><span>Low stock</span><b>{hoppers.filter(h=>h.fillPercent<=25).length}</b></div>
    </section>

    <section className="grid-two">
      <div className="card"><div className="section-head"><div><h2>Commodity Levels</h2><p>Live 3D hopper levels</p></div></div><Hopper3D hoppers={hoppers}/></div>
      <div className="card"><div className="section-head"><div><h2>Machine State</h2><p>Live weight and dispensing state</p></div></div><ThreeDMachine machine={machine}/></div>
    </section>

    <section className="card">
      <div className="section-head"><div><h2>Recent Transactions</h2><p>Latest Firestore records</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Beneficiary</th><th>Commodity</th><th>Requested</th><th>Actual</th><th>Status</th></tr></thead>
      <tbody>{transactions.map(t=><tr key={t.id}><td>{t.beneficiaryName || t.beneficiaryId}</td><td>{t.commodity}</td><td>{t.requestedKg.toFixed(3)} kg</td><td>{t.actualKg.toFixed(3)} kg</td><td><span className={"badge "+t.status}>{t.status}</span></td></tr>)}</tbody>
      </table></div>
    </section>
  </main>;
}
