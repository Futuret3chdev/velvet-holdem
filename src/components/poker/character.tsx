import { useEffect, useMemo, useRef, useState } from "react";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { visPos } from "@/lib/poker/seats";
import type { SeatPlayer } from "@/lib/poker/types";

export type Mood = "idle" | "think" | "fold" | "win" | "fire";

function moodOf(player: SeatPlayer, acting: boolean, winning: boolean): Mood {
  if (winning) return "win";
  if (player.folded) return "fold";
  if (acting) return "think";
  if (player.lastAct === "raise" || player.lastAct === "allin") return "fire";
  return "idle";
}

const TINT: Record<Mood, string> = {
  idle: "#ffffff",
  think: "#d5cfc4",
  fold: "#8a8680",
  win: "#fff3e0",
  fire: "#ffe6d4",
};

function usePortraitTexture(url: string) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) {
      setTex(null);
      return;
    }
    let dead = false;
    const loader = new THREE.TextureLoader();
    const handle = loader.load(url, (loaded) => {
      if (dead) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      loaded.minFilter = THREE.LinearFilter;
      loaded.needsUpdate = true;
      setTex(loaded);
    });
    return () => {
      dead = true;
      handle.dispose();
      setTex(null);
    };
  }, [url]);
  return tex;
}

function Chair() {
  return (
    <group position={[0, 0, -0.14]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.07, 0.4]} />
        <meshStandardMaterial color="#1a1612" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.58, -0.18]} castShadow>
        <boxGeometry args={[0.48, 0.64, 0.07]} />
        <meshStandardMaterial color="#161310" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Hands({
  jacket,
  skin,
  acting,
  folded,
  winning,
  phase,
  reduce,
}: {
  jacket: string;
  skin: string;
  acting: boolean;
  folded: boolean;
  winning: boolean;
  phase: number;
  reduce: boolean;
}) {
  const l = useRef<THREE.Group>(null);
  const r = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime + phase;
    const tap = reduce || folded ? 0 : acting ? Math.abs(Math.sin(t * 10)) * 0.05 : Math.abs(Math.sin(t * 1.4)) * 0.008;
    const up = winning ? 0.38 + Math.sin(t * 7) * 0.1 : folded ? -0.05 : 0;
    const rot = winning ? -1.15 : acting ? -0.55 : folded ? 0.15 : -0.25;
    if (l.current) {
      l.current.position.y = 0.13 + tap + up;
      l.current.rotation.x = rot;
    }
    if (r.current) {
      r.current.position.y = 0.13 + (acting ? Math.abs(Math.sin(t * 10 + 0.9)) * 0.05 : tap * 0.6) + up;
      r.current.rotation.x = rot;
    }
  });
  return (
    <>
      <group ref={l} position={[-0.14, 0.13, 0.18]}>
        <mesh rotation={[1.05, 0.2, 0.1]} castShadow>
          <capsuleGeometry args={[0.03, 0.15, 4, 8]} />
          <meshStandardMaterial color={jacket} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.1, 0.04]} castShadow>
          <sphereGeometry args={[0.036, 10, 10]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
      </group>
      <group ref={r} position={[0.14, 0.13, 0.18]}>
        <mesh rotation={[1.05, -0.2, -0.1]} castShadow>
          <capsuleGeometry args={[0.03, 0.15, 4, 8]} />
          <meshStandardMaterial color={jacket} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.1, 0.04]} castShadow>
          <sphereGeometry args={[0.036, 10, 10]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
      </group>
    </>
  );
}

function WinSparks({ on }: { on: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g || !on) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i += 1) {
      const ch = g.children[i]!;
      const u = (t * 0.7 + i * 0.19) % 1;
      ch.position.set(Math.sin(t * 2.2 + i) * 0.22, 0.7 + u * 0.85, Math.cos(t * 1.6 + i) * 0.1);
      ch.scale.setScalar(0.4 + (1 - u) * 0.8);
    }
  });
  if (!on) return null;
  return (
    <group ref={ref}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshBasicMaterial color="#efe8d8" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function FaceLife({
  radius,
  phase,
  mood,
  reduce,
}: {
  radius: number;
  phase: number;
  mood: Mood;
  reduce: boolean;
}) {
  const lidL = useRef<THREE.MeshBasicMaterial>(null);
  const lidR = useRef<THREE.MeshBasicMaterial>(null);
  const brow = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime + phase * 2.1;
    const period = 2.4 + (phase % 1.7);
    const cyc = t % period;
    const closed = !reduce && mood !== "fold" && (cyc < 0.09 || (cyc > 0.16 && cyc < 0.24 && phase % 1 > 0.45));
    const lid = closed ? 0.92 : 0;
    if (lidL.current) lidL.current.opacity = lid;
    if (lidR.current) lidR.current.opacity = lid;
    if (brow.current) brow.current.opacity = mood === "think" || mood === "fire" ? 0.3 : 0;
  });
  return (
    <group position={[0, radius * 0.12, 0.012]}>
      <mesh position={[-radius * 0.22, 0, 0]}>
        <planeGeometry args={[radius * 0.28, radius * 0.08]} />
        <meshBasicMaterial ref={lidL} color="#1a1410" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[radius * 0.22, 0, 0]}>
        <planeGeometry args={[radius * 0.28, radius * 0.08]} />
        <meshBasicMaterial ref={lidR} color="#1a1410" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, radius * 0.12, 0]}>
        <planeGeometry args={[radius * 0.72, radius * 0.14]} />
        <meshBasicMaterial ref={brow} color="#1a1410" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function EmptyChair({ seat, lit = false }: { seat: number; lit?: boolean }) {
  const [x, , z] = visPos(seat);
  return (
    <group position={[x, 0, z]}>
      <Chair />
      {lit ? <pointLight position={[0, 1.1, 0.2]} intensity={1.4} distance={2.2} color="#f0d9a8" /> : null}
    </group>
  );
}

export function Character({
  player,
  acting,
  winning,
}: {
  player: SeatPlayer;
  acting: boolean;
  winning: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const lean = useRef(0);
  const [x, , z] = visPos(player.seat);
  const mood = moodOf(player, acting, winning);
  const texture = usePortraitTexture(player.face);
  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const fidget =
    player.style === "maniac" ? 1.7 : player.style === "lag" ? 1.25 : player.style === "nit" ? 0.5 : 1;
  const radius = player.seat === 3 ? 0.5 : 0.46;

  useFrame((state, dt) => {
    const m = root.current;
    if (!m) return;
    const d = Math.min(dt, 0.1);
    const t = state.clock.elapsedTime + player.seat * 1.7;
    const targetLean = winning ? 0.06 : acting ? 0.16 : player.folded ? -0.1 : 0;
    lean.current += (targetLean - lean.current) * (1 - Math.exp(-7 * d));
    if (reduce) {
      m.position.y = winning ? 0.05 : 0;
      m.position.z = lean.current;
      m.rotation.set(player.folded ? -0.08 : 0, 0, 0);
      m.scale.setScalar(player.folded ? 0.96 : 1);
      return;
    }
    const breathe = Math.sin(t * (player.folded ? 0.9 : 1.85) * fidget) * (player.folded ? 0.01 : 0.022);
    const bounce = winning ? Math.abs(Math.sin(t * 6.4)) * 0.1 : 0;
    m.position.y = breathe + bounce;
    m.position.z = lean.current;
    m.rotation.z = Math.sin(t * 0.9 * fidget) * (acting ? 0.05 : 0.018);
    m.rotation.x = acting ? 0.08 : player.folded ? -0.14 : winning ? -0.05 : Math.sin(t * 0.55) * 0.022;
    m.scale.setScalar(player.folded ? 0.94 : winning ? 1.07 : acting ? 1.04 : 1);
  });

  return (
    <group position={[x, 0, z]}>
      <Chair />
      <group ref={root}>
        <mesh position={[0, 0.52, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.36, 6, 12]} />
          <meshStandardMaterial color={player.jacket} roughness={0.5} metalness={0.08} />
        </mesh>
        {texture ? (
          <Billboard follow position={[0, 1.08, 0.06]}>
            <mesh>
              <circleGeometry args={[radius, 48]} />
              <meshBasicMaterial map={texture} color={TINT[mood]} toneMapped={false} />
            </mesh>
            <mesh>
              <ringGeometry args={[radius, radius + 0.028, 48]} />
              <meshBasicMaterial color="#1c1814" toneMapped={false} />
            </mesh>
            <FaceLife radius={radius} phase={player.seat} mood={mood} reduce={reduce} />
          </Billboard>
        ) : null}
        <Hands
          jacket={player.jacket}
          skin={player.skin}
          acting={acting}
          folded={player.folded}
          winning={winning}
          phase={player.seat * 1.3}
          reduce={reduce}
        />
        <WinSparks on={winning} />
        {acting ? <pointLight position={[0, 1.2, 0.35]} intensity={2.2} distance={1.8} color="#f2e2c0" /> : null}
      </group>
    </group>
  );
}
