import { useEffect, useState } from "react";
import { listenMachine, sendDispenseCommand, DEFAULT_MACHINE } from "../store";
import type { Machine, Commodity } from "../types";
import { speak } from "../lib/voice";

const items: Commodity[] = ["rice","wheat","dal","sugar"];

export default function MachinePage(){
  const [machine,setMachine]=useState<Machine>(DEFAULT_MACHINE);
  const [commodity,setCommodity]=useState<Commodity>("rice");
  const [kg,setKg]=useState(2);
  useEffect(()=>listenMachine(setMachine),[]);

  async function start(){
    if(!machine.binPresent){ speak("Please place your container.","en-IN"); return; }
    await sendDispenseCommand(commodity,kg*1000);
    speak(`Dispensing ${commodity}. Please wait.`,"en-IN");
  }

  return <main className="page">
    <header className="topbar">
      <div><div className="eyebrow">ON-MACHINE UI</div><h1>Dispensing Console</h1><p>Laptop/mouse interface with bilingual voice guidance.</p></div>
    </header>
    <section className="card machine-console">
      <div className="console-status">
        <span className={machine.binPresent ? "badge success":"badge"}>{machine.binPresent ? "CONTAINER DETECTED":"PLACE CONTAINER"}</span>
        <span className={machine.online ? "badge success":"badge"}>{machine.online ? "ESP32 ONLINE":"OFFLINE"}</span>
      </div>
      <h2>Select commodity</h2>
      <div className="choice-row">{items.map(x=><button key={x} className={commodity===x?"selected":""} onClick={()=>setCommodity(x)}>{x.toUpperCase()}</button>)}</div>
      <h2>Quantity</h2>
      <div className="quantity-row">
        <button onClick={()=>setKg(v=>Math.max(.1,v-.1))}>−100 g</button>
        <strong>{kg.toFixed(1)} kg</strong>
        <button onClick={()=>setKg(v=>v+.1)}>+100 g</button>
      </div>
      <button className="primary-action" onClick={start} disabled={machine.dispensing}>CONFIRM & DISPENSE</button>
      <div className="weight-box">
        <div><span>Actual</span><b>{Math.round(machine.currentWeightG)} g</b></div>
        <div><span>Target</span><b>{Math.round(machine.targetWeightG)} g</b></div>
      </div>
    </section>
  </main>
}
