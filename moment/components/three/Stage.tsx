"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import Wheel from "./Wheel";

// Studio lighting is built from lightformers so the scene needs no HDR download.
export default function Stage({ active }: { active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.15, 6.2], fov: 30 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <Wheel />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <Environment resolution={256} frames={1}>
        <mesh scale={50}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#2e3137" side={THREE.BackSide} />
        </mesh>
        <Lightformer form="rect" intensity={3.2} position={[0, 4.5, 1.5]} rotation-x={Math.PI / 2} scale={[9, 2.2, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#ffe4b8" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[3, 7, 1]} />
        <Lightformer form="rect" intensity={2.6} position={[5, 0.6, 1]} rotation-y={-Math.PI / 2} scale={[2, 7, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[0, -3, 3]} rotation-x={-Math.PI / 2} scale={[6, 1, 1]} />
        <Lightformer form="ring" intensity={1.6} color="#d4a649" position={[0, 0.5, -6]} scale={4} />
      </Environment>
    </Canvas>
  );
}
