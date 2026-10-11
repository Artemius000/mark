"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { sceneState } from "@/lib/sceneState";

// Procedural wheel assembly: tyre, forged rim with diamond-cut spokes,
// drilled carbon-ceramic disc and a 10-piston caliper. Units: tyre radius = 1.

const V2 = THREE.Vector2;
const { clamp, lerp, degToRad } = THREE.MathUtils;

const band = (p: number, a: number, b: number) => {
  const t = clamp((p - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function arc(cx: number, cy: number, r: number, from: number, to: number, steps = 8) {
  const out: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = degToRad(lerp(from, to, i / steps));
    out.push(new V2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return out;
}

// Cross-section is listed counter-clockwise in (radius, axial) space so lathe normals face out.
function tyreGeometry() {
  const pts: THREE.Vector2[] = [
    new V2(0.665, -0.19),
    new V2(0.7, -0.21),
    new V2(0.8, -0.215),
    ...arc(0.93, -0.14, 0.07, -90, 0),
  ];
  for (const g of [-0.085, 0, 0.085]) {
    pts.push(new V2(1, g - 0.012), new V2(0.978, g - 0.012), new V2(0.978, g + 0.012), new V2(1, g + 0.012));
  }
  pts.push(...arc(0.93, 0.14, 0.07, 0, 90), new V2(0.8, 0.215), new V2(0.7, 0.21), new V2(0.665, 0.19), new V2(0.665, -0.19));
  const geo = new THREE.LatheGeometry(pts, 160);
  geo.rotateX(Math.PI / 2);
  return geo;
}

function barrelGeometry() {
  const pts = [
    new V2(0.66, -0.19),
    new V2(0.6, -0.17),
    new V2(0.6, 0.12),
    new V2(0.625, 0.17),
    new V2(0.665, 0.198),
    new V2(0.695, 0.212),
    new V2(0.705, 0.204),
  ];
  const geo = new THREE.LatheGeometry(pts, 128);
  geo.rotateX(Math.PI / 2);
  return geo;
}

function spokeGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.052, 0.14);
  s.lineTo(0.052, 0.14);
  s.quadraticCurveTo(0.036, 0.4, 0.03, 0.615);
  s.lineTo(-0.03, 0.615);
  s.quadraticCurveTo(-0.036, 0.4, -0.052, 0.14);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geo.translate(0, 0, -0.05);
  return geo;
}

function discGeometry() {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.56, 0, Math.PI * 2, false);
  const inner = new THREE.Path();
  inner.absarc(0, 0, 0.24, 0, Math.PI * 2, true);
  s.holes.push(inner);
  [0.33, 0.4, 0.47].forEach((r, ring) => {
    const n = 24;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.09;
      const h = new THREE.Path();
      h.absarc(Math.cos(a) * r, Math.sin(a) * r, 0.011, 0, Math.PI * 2, true);
      s.holes.push(h);
    }
  });
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: false, curveSegments: 64 });
  geo.translate(0, 0, -0.035);
  return geo;
}

function caliperGeometry() {
  const a0 = degToRad(8);
  const a1 = degToRad(58);
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.645, a0, a1, false);
  s.lineTo(Math.cos(a1) * 0.4, Math.sin(a1) * 0.4);
  s.absarc(0, 0, 0.4, a1, a0, true);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 5,
    curveSegments: 32,
  });
  geo.translate(0, 0, -0.09);
  return geo;
}

export default function Wheel() {
  const root = useRef<THREE.Group>(null);
  const tyre = useRef<THREE.Group>(null);
  const rim = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Group>(null);
  const caliper = useRef<THREE.Group>(null);
  const axle = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const spinSpeed = useRef(0.35);
  const smoothP = useRef(0);
  const { size } = useThree();
  const mobile = size.width < 768;

  const geo = useMemo(
    () => ({
      tyre: tyreGeometry(),
      barrel: barrelGeometry(),
      spoke: spokeGeometry(),
      disc: discGeometry(),
      caliper: caliperGeometry(),
    }),
    [],
  );

  const mat = useMemo(
    () => ({
      rubber: new THREE.MeshStandardMaterial({ color: "#0f0f10", roughness: 0.88, metalness: 0 }),
      gunmetal: new THREE.MeshPhysicalMaterial({ color: "#5d626b", metalness: 1, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.DoubleSide }),
      machined: new THREE.MeshPhysicalMaterial({ color: "#e2e5ea", metalness: 1, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.08 }),
      ceramic: new THREE.MeshStandardMaterial({ color: "#3e3f43", metalness: 0.45, roughness: 0.55 }),
      steel: new THREE.MeshStandardMaterial({ color: "#9a9ea5", metalness: 1, roughness: 0.3 }),
      gold: new THREE.MeshPhysicalMaterial({ color: "#d4a649", metalness: 0.35, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06 }),
      dark: new THREE.MeshStandardMaterial({ color: "#1b1c1f", metalness: 0.8, roughness: 0.45 }),
    }),
    [],
  );

  const spokes = useMemo(() => {
    const out: { angle: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const base = (i / 5) * Math.PI * 2;
      out.push({ angle: base - 0.13 }, { angle: base + 0.13 });
    }
    return out;
  }, []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 30);
    smoothP.current = lerp(smoothP.current, sceneState.progress, 1 - Math.pow(0.0015, Math.min(dt, 0.25)));
    const p = smoothP.current;
    const reduced = sceneState.reduced;

    // Rolling: idle spin plus a kick from scroll velocity, eased back down.
    const target = reduced ? 0 : 0.35 + Math.min(Math.abs(sceneState.velocity) / 900, 4);
    spinSpeed.current = lerp(spinSpeed.current, target * (1 - band(p, 0.05, 0.25) * 0.85), 1 - Math.pow(0.05, d));
    spin.current -= spinSpeed.current * d;
    for (const g of [tyre, rim, disc]) if (g.current) g.current.rotation.z = spin.current;

    // Teardown along the axle: wheel off → tyre off rim → caliper lifts → hub backs out.
    const wheelOff = band(p, 0.08, 0.28);
    const tyreOff = band(p, 0.3, 0.48);
    const caliperUp = band(p, 0.66, 0.84);
    const hubBack = band(p, 0.5, 0.66);
    if (tyre.current) tyre.current.position.z = wheelOff * 1.05 + tyreOff * 1.05;
    if (rim.current) rim.current.position.z = wheelOff * 1.05;
    if (caliper.current) {
      caliper.current.position.y = caliperUp * 0.7;
      caliper.current.position.z = caliperUp * 0.25;
    }
    if (disc.current) disc.current.position.z = -hubBack * 0.25;
    if (axle.current) axle.current.position.z = -hubBack * 0.75;

    if (root.current) {
      const turn = band(p, 0.06, 0.35);
      const px = sceneState.pointer.x;
      const py = sceneState.pointer.y;
      const heroX = mobile ? 0 : 1.25;
      const openX = mobile ? 0.5 : 0.15;
      root.current.position.x = lerp(heroX, openX, turn);
      root.current.position.y = mobile ? lerp(0.92, 0.55, turn) : lerp(-0.02, 0.1, turn);
      root.current.rotation.y = lerp(-0.5, -1.12, turn) + px * 0.16;
      root.current.rotation.x = 0.06 - py * 0.08 + turn * 0.12;
      const s = mobile ? lerp(0.56, 0.42, turn) : lerp(1, 0.86, turn);
      root.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={root}>
      <group ref={tyre}>
        <mesh geometry={geo.tyre} material={mat.rubber} castShadow />
      </group>

      <group ref={rim}>
        <mesh geometry={geo.barrel} material={mat.gunmetal} />
        <mesh position={[0, 0, 0.21]} material={mat.machined}>
          <torusGeometry args={[0.7, 0.011, 12, 160]} />
        </mesh>
        {spokes.map((s, i) => (
          <group key={i} rotation={[0, 0, s.angle]} position={[0, 0, 0.17]}>
            <mesh geometry={geo.spoke} material={[mat.machined, mat.gunmetal]} rotation={[-0.14, 0, 0]} />
          </group>
        ))}
        <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]} material={mat.gunmetal}>
          <cylinderGeometry args={[0.165, 0.18, 0.09, 64]} />
        </mesh>
        <mesh position={[0, 0, 0.19]} rotation={[Math.PI / 2, 0, 0]} material={mat.gold}>
          <cylinderGeometry args={[0.06, 0.066, 0.025, 48]} />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.112, Math.sin(a) * 0.112, 0.195]} rotation={[Math.PI / 2, 0, 0]} material={mat.steel}>
              <cylinderGeometry args={[0.019, 0.019, 0.04, 6]} />
            </mesh>
          );
        })}
      </group>

      <group ref={disc} position={[0, 0, -0.08]}>
        <mesh geometry={geo.disc} material={mat.ceramic} />
        <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={mat.steel}>
          <cylinderGeometry args={[0.235, 0.25, 0.1, 64, 1, true]} />
        </mesh>
        <mesh position={[0, 0, 0.1]} material={mat.steel}>
          <circleGeometry args={[0.235, 64]} />
        </mesh>
      </group>

      <group ref={caliper} position={[0, 0, 0]}>
        <mesh geometry={geo.caliper} material={mat.gold} position={[0, 0, -0.08]} />
      </group>

      <group ref={axle}>
        <mesh position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]} material={mat.dark}>
          <cylinderGeometry args={[0.2, 0.22, 0.34, 48]} />
        </mesh>
      </group>

      <ContactShadows position={[0, -1.04, 0]} opacity={0.55} scale={7} blur={2.8} far={2.6} frames={Infinity} />
    </group>
  );
}
