import { useEffect, useMemo, useRef, useState } from "react";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { visPos, visYaw } from "@/lib/poker/seats";
import type { SeatPlayer } from "@/lib/poker/types";

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
      loaded.anisotropy = 4;
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
    <group position={[0, 0, -0.1]}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.05, 0.3]} />
        <meshStandardMaterial color="#1a1612" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.4, -0.13]} castShadow>
        <boxGeometry args={[0.34, 0.42, 0.05]} />
        <meshStandardMaterial color="#161310" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function EmptyChair({ seat, lit = false }: { seat: number; lit?: boolean }) {
  const [x, , z] = visPos(seat);
  return (
    <group position={[x, 0, z]} rotation={[0, visYaw(seat), 0]}>
      <Chair />
      {lit ? <pointLight position={[0, 0.9, 0.15]} intensity={1.1} distance={1.8} color="#f0d9a8" /> : null}
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
  const [x, , z] = visPos(player.seat);
  const texture = usePortraitTexture(player.face);
  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const fidget =
    player.style === "maniac" ? 1.5 : player.style === "lag" ? 1.15 : player.style === "nit" ? 0.55 : 1;

  useFrame((state) => {
    const m = root.current;
    if (!m) return;
    const t = state.clock.elapsedTime + player.seat * 1.4;
    if (reduce) {
      m.scale.setScalar(player.folded ? 0.92 : acting ? 1.06 : 1);
      return;
    }
    const breathe = Math.sin(t * 1.7 * fidget) * (player.folded ? 0.006 : 0.014);
    m.position.y = breathe + (winning ? Math.abs(Math.sin(t * 6)) * 0.05 : 0);
    m.rotation.y = acting ? Math.sin(t * 1.2) * 0.06 : 0;
    m.scale.setScalar(player.folded ? 0.9 : winning ? 1.08 : acting ? 1.08 : 1);
  });

  return (
    <group position={[x, 0, z]} rotation={[0, visYaw(player.seat), 0]}>
      <Chair />
      <group ref={root}>
        <mesh position={[0, 0.38, 0.02]} castShadow>
          <capsuleGeometry args={[0.1, 0.22, 5, 10]} />
          <meshStandardMaterial
            color={player.jacket}
            roughness={0.5}
            metalness={0.08}
            opacity={player.folded ? 0.55 : 1}
            transparent={player.folded}
          />
        </mesh>
        {texture ? (
          <Billboard follow position={[0, 0.72, 0.06]}>
            <mesh>
              <circleGeometry args={[acting ? 0.16 : 0.13, 28]} />
              <meshBasicMaterial
                map={texture}
                toneMapped={false}
                color={player.folded ? "#8a8680" : acting ? "#fff4e8" : "#ffffff"}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[acting ? 0.16 : 0.13, acting ? 0.185 : 0.15, 28]} />
              <meshBasicMaterial color={acting ? "#efe8d8" : "#1c1814"} toneMapped={false} />
            </mesh>
          </Billboard>
        ) : null}
        {acting ? <pointLight position={[0, 0.9, 0.2]} intensity={1.6} distance={1.4} color="#f2e2c0" /> : null}
      </group>
    </group>
  );
}
