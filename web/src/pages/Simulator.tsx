import { useEffect, useState } from "react";
import { listenHoppers, listenMachine, writeSimulatorHopper, writeSimulatorMachine, DEFAULT_HOPPERS, DEFAULT_MACHINE } from "../store";
import type { Hopper, Machine } from "../types";

export default function Simulator() {
  const [hoppers,setHoppers]=useState<Hopper[]>(DEFAULT_HOPPERS);
  const [machine,setMachine]=useState<Machine>(DEFAULT_MACHINE);
  useEffect(()=>listenHoppers(setHoppers),[]);
  useEffect(()=>listenMachine(setMachine),[]);

  return <main className="page">
    <header className="topbar"><div><div className="eyebrow">TEST MODE</div><h1>Hardware Simulator</h1><p>Writes to the same Firestore fields used by the ESP32.</p></div></header>
    <section className="card">
      <h2>Hopper input</h2><div className="sim-grid">
      {hoppers.map(h=><div className="sim-card" key={h.id}><b>{h.name}</b><strong>{Math.round(h.fillPercent)}%</strong><input type="range" min="0" max="100" value={h.fillPercent} onChange={e=>writeSimulatorHopper(h.id,Number(e.target.value))}/></div>)}
      </div>
    </section>
    <section className="card">
      <h2>Machine sensor input</h2>
      <div className="button-row">
        <button onClick={()=>writeSimulatorMachine({online:true,machineAvailable:true})}>Online</button>
        <button onClick={()=>writeSimulatorMachine({online:false,machineAvailable:false})}>Offline</button>
        <button onClick={()=>writeSimulatorMachine({binPresent:true})}>Container detected</button>
        <button onClick={()=>writeSimulatorMachine({binPresent:false})}>Container removed</button>
        <button onClick={()=>writeSimulatorMachine({dispensing:true,activeCommodity:"rice",targetWeightG:2000,currentWeightG:850,gateOpen:true})}>Dispensing</button>
        <button onClick={()=>writeSimulatorMachine({dispensing:false,currentWeightG:2000,gateOpen:false,activeCommodity:""})}>Target reached</button>
      </div>
      <pre>{JSON.stringify(machine,null,2)}</pre>
    </section>
  </main>;
}
