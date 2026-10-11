"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { sceneState } from "@/lib/sceneState";
import Wheel, { band } from "./Wheel";
import { backdropTexture } from "./textures";
import { sceneLayout } from "./layout";

const BG = "#0a0a0b";
const { lerp } = THREE.MathUtils;

const introEase = () => {
  if (sceneState.reduced) return 1;
  if (sceneState.introAt < 0) return 0;
  const t = Math.min(1, (performance.now() - sceneState.introAt) / 2800);
  return 1 - Math.pow(1 - t, 4);
};

// Cinematic dolly-in after the preloader, then a slow orbit as the teardown progresses.
function CameraRig() {
  const p = useRef(0);
  const par = useRef({ x: 0, y: 0 });
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    p.current = lerp(p.current, sceneState.progress, 1 - Math.pow(0.002, Math.min(dt, 0.25)));
    const e = introEase();
    const turn = band(p.current, 0.06, 0.4);
    const L = sceneLayout(state.size.width, state.size.height);
    const cam = state.camera;
    const px = sceneState.pointer.x;
    const py = sceneState.pointer.y;
    // The dolly is driven by time (frame-rate independent); only pointer parallax is smoothed.
    const k = 1 - Math.pow(0.02, Math.min(dt, 0.1));
    par.current.x = lerp(par.current.x, px * 0.18, k);
    par.current.y = lerp(par.current.y, -py * 0.1, k);
    // The camera always rides above the floor, which is raised on phones and tablets.
    cam.position.set(
      lerp(L.camX0, 0, e) + par.current.x - turn * 0.25,
      lerp(L.camY[0], L.camY[1], e) + par.current.y + turn * 0.25,
      lerp(3.4, 6.2, e) + turn * 0.55,
    );
    look.set(L.lookX ? lerp(0.9, 0, e) * (1 - turn) : 0, L.lookY, 0);
    cam.lookAt(look);
  });
  return null;
}

// Studio ignition plus a strip light that sweeps across and drags highlights over the metal.
function StudioLights({ animated }: { animated: boolean }) {
  const sweep = useRef<THREE.Mesh>(null);
  const key = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const e = animated ? introEase() : 1;
    const t = state.clock.elapsedTime;
    if (sweep.current) {
      sweep.current.position.x = Math.sin(t * 0.32) * 8;
      (sweep.current.material as THREE.MeshBasicMaterial).color.setScalar(2.4 * e);
    }
    if (key.current) (key.current.material as THREE.MeshBasicMaterial).color.setScalar(3.2 * e);
  });
  return (
    <>
      <mesh scale={50}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#141518" side={THREE.BackSide} />
      </mesh>
      <Lightformer ref={key} form="rect" intensity={3.2} position={[0, 4.5, 1.5]} rotation-x={Math.PI / 2} scale={[9, 2.2, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#ffe2b8" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[3, 7, 1]} />
      <Lightformer form="rect" intensity={2} position={[5, 0.6, 1]} rotation-y={-Math.PI / 2} scale={[2, 7, 1]} />
      <Lightformer ref={sweep} form="rect" intensity={2.4} position={[0, 1.2, 5]} scale={[0.5, 9, 1]} />
      <Lightformer form="ring" intensity={1.4} color="#c6a15b" position={[0, 0.5, -6]} scale={4} />
    </>
  );
}

function Floor({ y, reflector }: { y: number; reflector: boolean }) {
  return (
    <group position={[0, y, 0]}>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[40, 40]} />
        {!reflector ? (
          <meshStandardMaterial color="#0a0a0b" roughness={0.85} metalness={0.2} />
        ) : (
          <MeshReflectorMaterial
            blur={[400, 120]}
            resolution={1024}
            mixBlur={1}
            mixStrength={28}
            roughness={0.9}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#0d0d0f"
            metalness={0.6}
            mirror={0.6}
          />
        )}
      </mesh>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.75} scale={8} blur={2.4} far={2} frames={Infinity} />
    </group>
  );
}

function Backdrop() {
  const tex = useMemo(() => backdropTexture(), []);
  return (
    <mesh position={[0, 1, -9]} scale={[26, 16, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={tex} toneMapped={false} fog={false} />
    </mesh>
  );
}

function KeySpot() {
  const ref = useRef<THREE.SpotLight>(null);
  useFrame(() => {
    if (ref.current) ref.current.intensity = 60 * introEase();
  });
  return <spotLight ref={ref} position={[2.5, 5, 3]} angle={0.42} penumbra={0.9} intensity={0} color="#fff3e2" distance={14} decay={2} />;
}

function Scene({ lite }: { lite: boolean }) {
  const { size } = useThree();
  const mobile = size.width < 768;
  const L = sceneLayout(size.width, size.height);
  const rich = !mobile && !lite;
  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 8, 18]} />
      <CameraRig />
      <Backdrop />
      <Wheel />
      <Floor y={L.floorY} reflector={L.reflector && !lite} />
      <KeySpot />
      <ambientLight intensity={0.08} />
      <Environment resolution={256} frames={rich ? Infinity : 1}>
        <StudioLights animated={rich} />
      </Environment>
      {rich && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.82} luminanceSmoothing={0.2} />
          <Vignette offset={0.22} darkness={0.78} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  );
}

export default function Stage({ active }: { active: boolean }) {
  // Weak GPUs drop to 1× pixels and lose the mirror floor and post-processing.
  const [dpr, setDpr] = useState(1.6);
  const [lite, setLite] = useState(false);
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      camera={{ position: [2.2, -0.45, 3.4], fov: 30, near: 0.1, far: 60 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.6)} flipflops={3} onFallback={() => setLite(true)}>
        <Scene lite={lite} />
      </PerformanceMonitor>
    </Canvas>
  );
}
