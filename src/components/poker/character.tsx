import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { seatPos } from "@/lib/poker/seats";
import type { SeatPlayer } from "@/lib/poker/types";

function Chair() {
  return (
    <group position={[0, 0, -0.18]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.07, 0.42]} />
        <meshStandardMaterial color="#1a1612" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.58, -0.2]} castShadow>
        <boxGeometry args={[0.46, 0.68, 0.07]} />
        <meshStandardMaterial color="#161310" roughness={0.7} />
      </mesh>
      {[
        [-0.18, 0.1, 0.16],
        [0.18, 0.1, 0.16],
        [-0.18, 0.1, -0.16],
        [0.18, 0.1, -0.16],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[0.05, 0.2, 0.05]} />
          <meshStandardMaterial color="#120f0c" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export function EmptyChair({ seat, lit = false }: { seat: number; lit?: boolean }) {
  const [x, , z] = seatPos(seat, 6, 2.55, 1.92);
  return (
    <group position={[x, 0, z]} rotation={[0, Math.atan2(-x, -z), 0]}>
      <Chair />
      {lit ? <pointLight position={[0, 1.1, 0.2]} intensity={1.6} distance={2.2} color="#f0d9a8" /> : null}
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
  const g = useRef<Group>(null);
  const [x, , z] = seatPos(player.seat, 6, 2.55, 1.92);
  const yaw = Math.atan2(-x, -z);
  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  useFrame((state) => {
    const m = g.current;
    if (!m) return;
    if (reduce) {
      m.position.y = winning ? 0.06 : 0;
      return;
    }
    const t = state.clock.elapsedTime + player.seat * 1.7;
    const idle = player.folded ? 0.008 : 0.022;
    m.position.y = Math.sin(t * 1.35) * idle + (winning ? 0.07 : 0) + (acting ? 0.04 : 0);
    m.rotation.z = Math.sin(t * 0.8) * (acting ? 0.045 : 0.018);
  });

  const id = player.id;
  const scale: [number, number, number] =
    id === "bot-2" ? [1.12, 1.02, 1.08] : id === "bot-3" ? [0.94, 0.96, 0.94] : id === "bot-0" ? [1, 1.05, 1] : [1, 1, 1];

  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]} scale={scale}>
      <Chair />
      <group ref={g}>
        <mesh position={[0.2, 0.42, 0.22]} rotation={[1.15, 0.18, 0.12]} castShadow>
          <capsuleGeometry args={[0.045, 0.34, 4, 8]} />
          <meshStandardMaterial color={player.jacket} roughness={0.55} />
        </mesh>
        <mesh position={[-0.2, 0.42, 0.22]} rotation={[1.15, -0.18, -0.12]} castShadow>
          <capsuleGeometry args={[0.045, 0.34, 4, 8]} />
          <meshStandardMaterial color={player.jacket} roughness={0.55} />
        </mesh>
        <mesh position={[0.22, 0.12, 0.48]} rotation={[0, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color={player.skin} roughness={0.55} />
        </mesh>
        <mesh position={[-0.22, 0.12, 0.48]} rotation={[0, -0.2, 0]} castShadow>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color={player.skin} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.62, 0.02]} castShadow>
          <capsuleGeometry args={[0.17, 0.44, 6, 12]} />
          <meshStandardMaterial color={player.jacket} roughness={0.48} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.92, 0.08]} rotation={[0.18, 0, 0]} castShadow>
          <boxGeometry args={[0.36, 0.14, 0.07]} />
          <meshStandardMaterial color={player.accent} roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.48, 0.04]} castShadow>
          <boxGeometry args={[0.34, 0.08, 0.16]} />
          <meshStandardMaterial color="#121014" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.2, 0.02]} castShadow>
          <sphereGeometry args={[0.155, 20, 18]} />
          <meshStandardMaterial color={player.skin} roughness={0.52} />
        </mesh>
        <mesh position={[0, 1.14, 0.145]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={player.skin} roughness={0.6} />
        </mesh>
        <mesh position={[-0.05, 1.22, 0.13]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.05, 1.22, 0.13]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0, 1.12, 0.14]} rotation={[player.folded ? 0.35 : 0.08, 0, 0]}>
          <boxGeometry args={[0.07, 0.012, 0.02]} />
          <meshStandardMaterial color="#3a241c" />
        </mesh>
        <Hair player={player} />
        {id === "bot-0" ? <Glasses /> : null}
        {id === "bot-1" ? <Earring color="#d7c38a" /> : null}
        {id === "bot-2" ? <Beard color="#4a3224" /> : null}
        {id === "bot-3" ? <Pearls /> : null}
        {acting ? (
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial color="#e8eaee" emissive="#e8eaee" emissiveIntensity={0.85} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}

function Hair({ player }: { player: SeatPlayer }) {
  const id = player.id;
  if (id === "bot-1") {
    return (
      <group>
        <mesh position={[0, 1.3, -0.02]} castShadow>
          <sphereGeometry args={[0.16, 16, 12, 0, Math.PI * 2, 0, 1.15]} />
          <meshStandardMaterial color={player.hair} roughness={0.68} />
        </mesh>
        <mesh position={[0, 1.38, -0.12]} castShadow>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={player.hair} roughness={0.7} />
        </mesh>
      </group>
    );
  }
  if (id === "bot-3") {
    return (
      <mesh position={[0, 1.22, -0.08]} scale={[1.05, 1.15, 1.2]} castShadow>
        <sphereGeometry args={[0.17, 16, 12]} />
        <meshStandardMaterial color={player.hair} roughness={0.62} />
      </mesh>
    );
  }
  if (id === "bot-4") {
    return (
      <mesh position={[0, 1.3, -0.01]} castShadow>
        <boxGeometry args={[0.28, 0.12, 0.24]} />
        <meshStandardMaterial color={player.hair} roughness={0.55} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, 1.3, -0.02]} castShadow>
      <sphereGeometry args={[0.158, 16, 12, 0, Math.PI * 2, 0, 1.12]} />
      <meshStandardMaterial color={player.hair} roughness={0.7} />
    </mesh>
  );
}

function Glasses() {
  return (
    <group position={[0, 1.22, 0.145]}>
      <mesh position={[-0.055, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.038, 0.006, 8, 16]} />
        <meshStandardMaterial color="#cfd3d8" metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[0.055, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.038, 0.006, 8, 16]} />
        <meshStandardMaterial color="#cfd3d8" metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.03, 0.008, 0.008]} />
        <meshStandardMaterial color="#cfd3d8" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Earring({ color }: { color: string }) {
  return (
    <mesh position={[0.15, 1.16, 0.04]}>
      <torusGeometry args={[0.025, 0.005, 8, 14]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
    </mesh>
  );
}

function Beard({ color }: { color: string }) {
  return (
    <mesh position={[0, 1.1, 0.1]} scale={[0.9, 0.55, 0.7]} castShadow>
      <sphereGeometry args={[0.12, 12, 10]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

function Pearls() {
  return (
    <group position={[0, 1.02, 0.12]}>
      {[-0.06, 0, 0.06].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <sphereGeometry args={[0.018, 10, 10]} />
          <meshStandardMaterial color="#efe8d8" roughness={0.25} metalness={0.35} />
        </mesh>
      ))}
    </group>
  );
}
