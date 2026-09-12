import { Canvas } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Text } from "@react-three/drei";
import type { Machine } from "../types";

export function ThreeDMachine({machine}:{machine:Machine}) {
  const weight = machine.targetWeightG > 0 ? Math.min(1,machine.currentWeightG/machine.targetWeightG) : 0;
  return <div className="model-panel machine-model">
    <Canvas camera={{position:[5,3.4,6.5], fov:42}}>
      <ambientLight intensity={1.2}/>
      <directionalLight position={[3,5,4]} intensity={2}/>
      <RoundedBox args={[4.8,4.4,2.5]} radius={0.22} position={[0,0,0]}>
        <meshPhysicalMaterial color="#111827" metalness={0.55} roughness={0.24}/>
      </RoundedBox>
      <RoundedBox args={[4.1,1.9,0.22]} radius={0.12} position={[0,1.15,1.32]}>
        <meshStandardMaterial color="#07101f" metalness={0.2} roughness={0.2}/>
      </RoundedBox>
      <mesh position={[0,1.15,1.45]}>
        <boxGeometry args={[3.75,1.55,0.04]}/>
        <meshStandardMaterial color="#0f2742" emissive="#071a32"/>
      </mesh>
      <Text position={[0,1.15,1.5]} fontSize={0.28} color="#7dd3fc" anchorX="center">
        {machine.dispensing ? "DISPENSING" : machine.binPresent ? "CONTAINER READY" : "WAITING"}
      </Text>
      <group position={[0,-1.2,1.38]}>
        <RoundedBox args={[1.55,0.7,0.9]} radius={0.12}>
          <meshStandardMaterial color="#26354b" metalness={0.5}/>
        </RoundedBox>
        <mesh position={[0,-0.08,0.48]}>
          <boxGeometry args={[1.25,0.35,0.08]}/>
          <meshStandardMaterial color="#38bdf8"/>
        </mesh>
      </group>
      <mesh position={[0,-0.95,0]}>
        <boxGeometry args={[3.1,0.12,1.5]}/>
        <meshStandardMaterial color="#253149"/>
      </mesh>
      <mesh position={[0,-0.89,0.52]}>
        <boxGeometry args={[2.5,0.05,0.95*weight]}/>
        <meshStandardMaterial color="#22c55e"/>
      </mesh>
      <Text position={[0,-1.95,1.3]} fontSize={0.23} color="white" anchorX="center">
        {Math.round(machine.currentWeightG)}g / {Math.round(machine.targetWeightG)}g
      </Text>
      <OrbitControls enablePan={false} minDistance={5} maxDistance={9}/>
    </Canvas>
  </div>;
}
