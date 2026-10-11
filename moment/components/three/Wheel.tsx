"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { sceneState } from "@/lib/sceneState";
import { discTextures, sidewallTexture, treadBump, wordDecal } from "./textures";
import { sceneLayout } from "./layout";

// Procedural wheel assembly: tyre with moulded sidewall and siped tread, forged rim with
// diamond-cut spokes, drilled carbon-ceramic disc and a 10-piston caliper. Tyre radius = 1.

const V2 = THREE.Vector2;
const { clamp, lerp, degToRad } = THREE.MathUtils;

export const band = (p: number, a: number, b: number) => {
  const t = clamp((p - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Scroll windows for the four measurements (shared with the DOM callouts).
export const STAGES = [0.12, 0.32, 0.52, 0.7];
const STAGE_LEN = 0.18;

function arc(cx: number, cy: number, r: number, from: number, to: number, steps = 10) {
  const out: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = degToRad(lerp(from, to, i / steps));
    out.push(new V2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return out;
}

// Cross-section listed counter-clockwise in (radius, axial) space so lathe normals face out.
function tyreGeometry() {
  const pts: THREE.Vector2[] = [new V2(0.665, -0.19), new V2(0.7, -0.212), new V2(0.8, -0.217), ...arc(0.93, -0.14, 0.07, -90, 0)];
  const treadStart = pts.length - 1;
  for (const g of [-0.085, 0, 0.085]) {
    pts.push(new V2(0.999, g - 0.013), new V2(0.976, g - 0.011), new V2(0.976, g + 0.011), new V2(0.999, g + 0.013));
  }
  const treadEnd = pts.length;
  pts.push(...arc(0.93, 0.14, 0.07, 0, 90), new V2(0.8, 0.217), new V2(0.7, 0.212), new V2(0.665, 0.19), new V2(0.665, -0.19));
  const geo = new THREE.LatheGeometry(pts, 200);
  geo.rotateX(Math.PI / 2);
  const n = pts.length - 1;
  return { geo, v0: treadStart / n, v1: treadEnd / n };
}

function barrelGeometry() {
  const pts = [
    new V2(0.66, -0.19),
    new V2(0.6, -0.17),
    new V2(0.598, 0.1),
    new V2(0.625, 0.165),
    new V2(0.665, 0.196),
    new V2(0.695, 0.21),
    new V2(0.706, 0.203),
  ];
  const geo = new THREE.LatheGeometry(pts, 160);
  geo.rotateX(Math.PI / 2);
  return geo;
}

function spokeGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.05, 0.2);
  s.lineTo(0.05, 0.2);
  s.quadraticCurveTo(0.034, 0.42, 0.03, 0.612);
  s.lineTo(-0.03, 0.612);
  s.quadraticCurveTo(-0.034, 0.42, -0.05, 0.2);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.011, bevelSegments: 4, curveSegments: 16 });
  geo.translate(0, 0, -0.05);
  return geo;
}

function stemGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.07, 0.13);
  s.lineTo(0.07, 0.13);
  s.lineTo(0.095, 0.27);
  s.quadraticCurveTo(0, 0.32, -0.095, 0.27);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.055, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 4, curveSegments: 12 });
  geo.translate(0, 0, -0.055);
  return geo;
}

const DISC_R = 0.56;
function discGeometry() {
  const s = new THREE.Shape();
  s.absarc(0, 0, DISC_R, 0, Math.PI * 2, false);
  const inner = new THREE.Path();
  inner.absarc(0, 0, 0.245, 0, Math.PI * 2, true);
  s.holes.push(inner);
  [0.335, 0.405, 0.475].forEach((r, ring) => {
    const n = 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.1;
      const h = new THREE.Path();
      h.absarc(Math.cos(a) * r, Math.sin(a) * r, 0.0105, 0, Math.PI * 2, true);
      s.holes.push(h);
    }
  });
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 72 });
  geo.translate(0, 0, -0.035);
  return geo;
}

function caliperGeometry() {
  const a0 = degToRad(6);
  const a1 = degToRad(60);
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.645, a0, a1, false);
  s.lineTo(Math.cos(a1) * 0.4, Math.sin(a1) * 0.4);
  s.absarc(0, 0, 0.4, a1, a0, true);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.17, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.032, bevelSegments: 6, curveSegments: 40 });
  geo.translate(0, 0, -0.085);
  return geo;
}

function Hotspot({ position, n, label, setRef }: { position: [number, number, number]; n: number; label: string; setRef: (el: HTMLDivElement | null) => void }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div ref={setRef} style={{ opacity: 0, transition: "opacity .45s, transform .45s", transform: "scale(.8)" }} className="flex items-center gap-3 whitespace-nowrap">
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-brass [animation:hotspot_1.6s_ease-out_infinite]" />
          <span className="h-1.5 w-1.5 rounded-full bg-brass" />
        </span>
        <span className="h-px w-10 bg-brass/70" />
        <span className="eyebrow rounded-full bg-carbon/70 px-2.5 py-1 text-[10px] text-paper backdrop-blur">
          {String(n).padStart(2, "0")} · {label}
        </span>
      </div>
    </Html>
  );
}

export default function Wheel() {
  const root = useRef<THREE.Group>(null);
  const tyre = useRef<THREE.Group>(null);
  const rim = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Group>(null);
  const caliper = useRef<THREE.Group>(null);
  const axle = useRef<THREE.Group>(null);
  const hot = useRef<(HTMLDivElement | null)[]>([]);
  const spin = useRef(0);
  const spinSpeed = useRef(9);
  const smoothP = useRef(0);
  const { size } = useThree();
  const L = sceneLayout(size.width, size.height);

  const geo = useMemo(() => {
    const t = tyreGeometry();
    return { tyre: t.geo, tread: [t.v0, t.v1] as const, barrel: barrelGeometry(), spoke: spokeGeometry(), stem: stemGeometry(), disc: discGeometry(), caliper: caliperGeometry() };
  }, []);

  const mat = useMemo(() => {
    const bump = treadBump(geo.tread[0], geo.tread[1]);
    const d = discTextures(DISC_R);
    return {
      rubber: new THREE.MeshStandardMaterial({ color: "#151516", roughness: 0.86, metalness: 0, bumpMap: bump, bumpScale: 1.4 }),
      sidewall: new THREE.MeshStandardMaterial({ map: sidewallTexture(0.885), transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      gunmetal: new THREE.MeshPhysicalMaterial({ color: "#4a4e56", metalness: 1, roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.18, side: THREE.DoubleSide }),
      machined: new THREE.MeshPhysicalMaterial({ color: "#c9ccd2", metalness: 1, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.12 }),
      ceramic: new THREE.MeshStandardMaterial({ map: d.map, roughnessMap: d.rough, roughness: 0.75, metalness: 0.35 }),
      ceramicEdge: new THREE.MeshStandardMaterial({ color: "#2f3033", roughness: 0.7, metalness: 0.3 }),
      steel: new THREE.MeshStandardMaterial({ color: "#a5a9b0", metalness: 1, roughness: 0.26 }),
      gold: new THREE.MeshPhysicalMaterial({ color: "#d2a646", metalness: 0.3, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04 }),
      dark: new THREE.MeshStandardMaterial({ color: "#1b1c1f", metalness: 0.85, roughness: 0.42 }),
      cap: new THREE.MeshPhysicalMaterial({ color: "#0c0c0d", metalness: 0.6, roughness: 0.2, clearcoat: 1 }),
      caliperWord: new THREE.MeshStandardMaterial({ map: wordDecal("МОМЕНТ", "#121212"), transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }),
      capWord: new THREE.MeshStandardMaterial({ map: wordDecal("М", "#c6a15b", 256, 256, 700), transparent: true, metalness: 0.8, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }),
    };
  }, [geo.tread]);

  const spokes = useMemo(() => {
    const out: { angle: number; base: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const base = (i / 5) * Math.PI * 2;
      out.push({ angle: base - 0.12, base }, { angle: base + 0.12, base });
    }
    return out;
  }, []);

  useFrame((_, dt) => {
    smoothP.current = lerp(smoothP.current, sceneState.progress, 1 - Math.pow(0.002, Math.min(dt, 0.25)));
    const p = smoothP.current;
    const reduced = sceneState.reduced;

    // Rolling: arrives spinning, settles to idle; scroll velocity adds a kick.
    const intro = sceneState.introAt < 0 ? 0 : Math.min(1, (performance.now() - sceneState.introAt) / 2600);
    const idle = reduced ? 0 : 0.3 + Math.min(Math.abs(sceneState.velocity) / 800, 5);
    const target = (intro < 1 ? lerp(9, idle, 1 - Math.pow(1 - intro, 3)) : idle) * (1 - band(p, 0.05, 0.22) * 0.9);
    spinSpeed.current = lerp(spinSpeed.current, target, 1 - Math.pow(0.04, Math.min(dt, 0.1)));
    spin.current -= spinSpeed.current * Math.min(dt, 0.1);
    for (const g of [tyre, rim, disc]) if (g.current) g.current.rotation.z = spin.current;

    // Teardown along the axle: wheel off → tyre off rim → hub backs out → caliper lifts.
    const wheelOff = band(p, 0.08, 0.28);
    const tyreOff = band(p, 0.3, 0.48);
    const hubBack = band(p, 0.5, 0.66);
    const caliperUp = band(p, 0.68, 0.84);
    if (tyre.current) tyre.current.position.z = wheelOff * 1.05 + tyreOff * 1.05;
    if (rim.current) rim.current.position.z = wheelOff * 1.05;
    if (disc.current) disc.current.position.z = -0.08 - hubBack * 0.28;
    if (axle.current) axle.current.position.z = -hubBack * 0.8;
    if (caliper.current) {
      caliper.current.position.y = caliperUp * 0.62;
      caliper.current.position.z = caliperUp * 0.22;
      caliper.current.rotation.z = caliperUp * 0.15;
    }

    // Hotspots follow the active measurement.
    hot.current.forEach((el, i) => {
      if (!el) return;
      const on = p > STAGES[i] + 0.02 && p < STAGES[i] + STAGE_LEN;
      el.style.opacity = on ? "1" : "0";
      el.style.transform = on ? "scale(1)" : "scale(.8)";
    });

    if (root.current) {
      const turn = band(p, 0.06, 0.35);
      root.current.position.x = lerp(L.heroX, L.openX, turn);
      root.current.position.y = L.rootY;
      root.current.rotation.y = lerp(-0.42, -1.1, turn);
      root.current.rotation.x = 0.04 + turn * 0.1;
      root.current.scale.setScalar(lerp(L.scale[0], L.scale[1], turn));
    }
  });

  return (
    <group ref={root}>
      <group ref={tyre}>
        <mesh geometry={geo.tyre} material={mat.rubber} />
        <mesh position={[0, 0, 0.2195]} material={mat.sidewall}>
          <ringGeometry args={[0.72, 0.885, 160, 1]} />
        </mesh>
        <Hotspot position={[0, 1.04, 0.1]} n={1} label="Протектор" setRef={(el) => (hot.current[0] = el)} />
      </group>

      <group ref={rim}>
        <mesh geometry={geo.barrel} material={mat.gunmetal} />
        <mesh position={[0, 0, 0.207]} material={mat.machined}>
          <torusGeometry args={[0.701, 0.009, 12, 200]} />
        </mesh>
        {spokes.map((s, i) => (
          <group key={i} rotation={[0, 0, s.angle]} position={[0, 0, 0.175]}>
            <mesh geometry={geo.spoke} material={[mat.machined, mat.gunmetal]} rotation={[-0.15, 0, 0]} />
          </group>
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]} position={[0, 0, 0.18]}>
            <mesh geometry={geo.stem} material={[mat.machined, mat.gunmetal]} rotation={[-0.08, 0, 0]} />
          </group>
        ))}
        <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={mat.gunmetal}>
          <cylinderGeometry args={[0.16, 0.175, 0.08, 64]} />
        </mesh>
        <mesh position={[0, 0, 0.195]} rotation={[Math.PI / 2, 0, 0]} material={mat.cap}>
          <cylinderGeometry args={[0.062, 0.068, 0.03, 64]} />
        </mesh>
        <mesh position={[0, 0, 0.2105]} material={mat.capWord}>
          <planeGeometry args={[0.07, 0.07]} />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
          return (
            <group key={i} position={[Math.cos(a) * 0.112, Math.sin(a) * 0.112, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh material={mat.steel}>
                <cylinderGeometry args={[0.019, 0.019, 0.038, 6]} />
              </mesh>
              <mesh position={[0, 0.021, 0]} material={mat.machined}>
                <cylinderGeometry args={[0.012, 0.017, 0.006, 24]} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[0.63 * Math.cos(1.2), 0.63 * Math.sin(1.2), 0.17]} rotation={[Math.PI / 2, 0, 0]} material={mat.dark}>
          <cylinderGeometry args={[0.009, 0.009, 0.06, 12]} />
        </mesh>
        <Hotspot position={[0.36, 0.4, 0.25]} n={2} label="Биение диска" setRef={(el) => (hot.current[1] = el)} />
      </group>

      <group ref={disc} position={[0, 0, -0.08]}>
        <mesh geometry={geo.disc} material={[mat.ceramic, mat.ceramicEdge]} />
        <mesh position={[0, 0, 0.055]} rotation={[Math.PI / 2, 0, 0]} material={mat.steel}>
          <cylinderGeometry args={[0.235, 0.25, 0.11, 64, 1, true]} />
        </mesh>
        <mesh position={[0, 0, 0.11]} material={mat.steel}>
          <circleGeometry args={[0.235, 64]} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0.04]} rotation={[Math.PI / 2, 0, 0]} material={mat.machined}>
              <cylinderGeometry args={[0.012, 0.012, 0.02, 12]} />
            </mesh>
          );
        })}
        <Hotspot position={[-0.38, -0.3, 0.06]} n={3} label="Масса диска" setRef={(el) => (hot.current[2] = el)} />
      </group>

      <group ref={caliper}>
        <group position={[0, 0, -0.08]}>
          <mesh geometry={geo.caliper} material={mat.gold} />
          <mesh position={[Math.cos(degToRad(33)) * 0.525, Math.sin(degToRad(33)) * 0.525, 0.127]} rotation={[0, 0, degToRad(33 - 90)]} material={mat.caliperWord}>
            <planeGeometry args={[0.2, 0.05]} />
          </mesh>
          {[12, 54].map((deg) => (
            <mesh key={deg} position={[Math.cos(degToRad(deg)) * 0.6, Math.sin(degToRad(deg)) * 0.6, 0.126]} rotation={[Math.PI / 2, 0, 0]} material={mat.steel}>
              <cylinderGeometry args={[0.014, 0.014, 0.012, 6]} />
            </mesh>
          ))}
        </group>
        <Hotspot position={[0.42, 0.45, 0.1]} n={4} label="Жидкость DOT 4" setRef={(el) => (hot.current[3] = el)} />
      </group>

      <group ref={axle}>
        <mesh position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]} material={mat.dark}>
          <cylinderGeometry args={[0.2, 0.22, 0.34, 48]} />
        </mesh>
      </group>
    </group>
  );
}
