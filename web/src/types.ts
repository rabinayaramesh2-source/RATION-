export type Commodity = "rice" | "wheat" | "dal" | "sugar";

export type Hopper = {
  id: Commodity;
  name: string;
  stockKg: number;
  capacityKg: number;
  fillPercent: number;
  state: "normal" | "low" | "refill" | "full";
  updatedAt?: unknown;
};

export type Machine = {
  id: string;
  online: boolean;
  wifiRssi: number;
  batteryPercent: number;
  solarCharging: boolean;
  machineAvailable: boolean;
  binPresent: boolean;
  dispensing: boolean;
  activeCommodity: Commodity | "";
  currentWeightG: number;
  targetWeightG: number;
  gateOpen: boolean;
  emergencyStop: boolean;
  updatedAt?: unknown;
};

export type Transaction = {
  id: string;
  beneficiaryId: string;
  beneficiaryName?: string;
  commodity: Commodity;
  requestedKg: number;
  actualKg: number;
  status: "success" | "partial" | "failed";
  machineId: string;
  createdAt?: unknown;
};
