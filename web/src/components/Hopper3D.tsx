import { Canvas } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { Hopper } from "../types";

function OneHopper({hopper}:{hopper:Hopper}) {
  const fill = Math.max(0.02, Math.min(1, hopper.fillPercent/100));
  const levelY = -1.25 + 2.5*fill;
  const tint = useMemo(() => {
    if (hopper.fillPercent <= 10) return "#ef4444";
    if (hopper.fillPercent <= 25) return "#f59e0b";
    return "#38bdf8";
  }, [hopper.fillPercent]);

  return (
    <group>
      <RoundedBox args={[2.5,3.2,2.1]} radius={0.18} smoothness={5} position={[0,0,0]}>
        <meshPhysicalMaterial color="#172033" metalness={0.45} roughness={0.25} transparent opacity={0.82} />
      </RoundedBox>
      <mesh position={[0,levelY,0]}>
        <boxGeometry args={[2.18, Math.max(0.05,2.45*fill),1.82]} />
        <meshStandardMaterial color={tint} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0,1.78,0]}>
        <cylinderGeometry args={[1.15,0.92,0.45,32]} />
        <meshStandardMaterial color="#0b1220" metalness={0.55} roughness={0.25} />
      </mesh>
      <Text position={[0,2.35,0]} fontSize={0.25} color="white" anchorX="center">
        {hopper.name}
      </Text>
      <Text position={[0,0,1.08]} fontSize={0.34} color="white" anchorX="center">
        {Math.round(hopper.fillPercent)}%
      </Text>
    </group>
  );
}

export function Hopper3D({hoppers}:{hoppers:Hopper[]}) {
  return (
    <div className="model-panel">
      <Canvas camera={{position:[7,4.8,9], fov:42}}>
        <ambientLight intensity={1.3}/>
        <directionalLight position={[4,7,5]} intensity={2}/>
        <pointLight position={[-5,3,-2]} intensity={1.5}/>
        <group position={[-3.9,0,0]}><OneHopper hopper={hoppers[0]}/></group>
        <group position={[-1.3,0,0]}><OneHopper hopper={hoppers[1]}/></group>
        <group position={[1.3,0,0]}><OneHopper hopper={hoppers[2]}/></group>
        <group position={[3.9,0,0]}><OneHopper hopper={hoppers[3]}/></group>
        <gridHelper args={[12,12,"#24324a","#182236"]}/>
        <OrbitControls enablePan={false} minDistance={8} maxDistance={16}/>
      </Canvas>
      <div className="model-caption">Live 3D stock model — level comes from Firebase hardware telemetry</div>
    </div>
  );
}
