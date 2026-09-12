import {
  collection, doc, onSnapshot, orderBy, query, limit, serverTimestamp, setDoc
} from "firebase/firestore";
import { db, firebaseEnabled, machineId } from "./firebase";
import type { Hopper, Machine, Transaction } from "./types";

export const DEFAULT_HOPPERS: Hopper[] = [
  { id:"rice", name:"Rice", stockKg:16, capacityKg:20, fillPercent:80, state:"normal" },
  { id:"wheat", name:"Wheat", stockKg:12, capacityKg:20, fillPercent:60, state:"normal" },
  { id:"dal", name:"Dal", stockKg:7, capacityKg:10, fillPercent:70, state:"normal" },
  { id:"sugar", name:"Sugar", stockKg:3, capacityKg:10, fillPercent:30, state:"normal" }
];

export const DEFAULT_MACHINE: Machine = {
  id: machineId, online:true, wifiRssi:-54, batteryPercent:87,
  solarCharging:true, machineAvailable:true, binPresent:false,
  dispensing:false, activeCommodity:"", currentWeightG:0, targetWeightG:0,
  gateOpen:false, emergencyStop:false
};

export function listenMachine(cb:(m:Machine)=>void) {
  if (!firebaseEnabled || !db) { cb(DEFAULT_MACHINE); return () => {}; }
  return onSnapshot(doc(db,"machines",machineId), s => {
    cb(s.exists() ? ({...DEFAULT_MACHINE, ...s.data(), id:machineId} as Machine) : DEFAULT_MACHINE);
  }, () => cb({...DEFAULT_MACHINE, online:false}));
}

export function listenHoppers(cb:(h:Hopper[])=>void) {
  if (!firebaseEnabled || !db) { cb(DEFAULT_HOPPERS); return () => {}; }
  return onSnapshot(collection(db,"hoppers"), snap => {
    const byId = Object.fromEntries(snap.docs.map(d=>[d.id,d.data()]));
    cb(DEFAULT_HOPPERS.map(h=>({...h,...(byId[h.id]||{})})));
  }, () => cb(DEFAULT_HOPPERS));
}

export function listenTransactions(cb:(t:Transaction[])=>void) {
  if (!firebaseEnabled || !db) { cb([]); return () => {}; }
  const q = query(collection(db,"transactions"), orderBy("createdAt","desc"), limit(20));
  return onSnapshot(q, snap => cb(snap.docs.map(d=>({id:d.id,...d.data()} as Transaction))), () => cb([]));
}

export async function writeSimulatorHopper(id:string, fillPercent:number) {
  if (!firebaseEnabled || !db) return;
  const safe = Math.max(0, Math.min(100, fillPercent));
  const capacity = DEFAULT_HOPPERS.find(h=>h.id===id)?.capacityKg ?? 20;
  await setDoc(doc(db,"hoppers",id), {
    fillPercent:safe, stockKg:capacity*safe/100,
    state:safe<=10 ? "low" : safe>=100 ? "full" : "normal",
    updatedAt:serverTimestamp()
  }, {merge:true});
}

export async function writeSimulatorMachine(patch:Partial<Machine>) {
  if (!firebaseEnabled || !db) return;
  await setDoc(doc(db,"machines",machineId), {...patch, updatedAt:serverTimestamp()}, {merge:true});
}


export async function sendDispenseCommand(commodity:string, targetWeightG:number) {
  if (!firebaseEnabled || !db) return;
  await setDoc(doc(db,"machines",machineId,"commands","current"), {
    commandId: crypto.randomUUID(),
    type: "DISPENSE",
    commodity,
    targetWeightG: Math.max(100, Math.round(targetWeightG)),
    createdAt: serverTimestamp(),
    handled: false
  });
}
