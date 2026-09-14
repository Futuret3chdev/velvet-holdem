import { useEffect, useMemo, useRef, useState } from "react";
import { Billboard, Html } from "@react-three/drei";
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

const FILTER: Record<Mood, string> = {
  idle: "brightness(1.08) contrast(1.1) saturate(1.08)",
  think: "brightness(1.04) contrast(1.2) saturate(0.9)",
  fold: "brightness(0.68) saturate(0.22) contrast(0.92)",
  win: "brightness(1.22) saturate(1.3) contrast(1.12)",
  fire: "brightness(1.14) contrast(1.22) saturate(1.12)",
};

function paintMood(ctx: CanvasRenderingContext2D, img: HTMLImageElement, mood: Mood, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.filter = FILTER[mood];
  ctx.drawImage(img, 0, 0, w, h);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-atop";
  if (mood === "win") {
    ctx.fillStyle = "rgba(210, 86, 86, 0.18)";
    ctx.beginPath();
    ctx.ellipse(w * 0.32, h * 0.46, w * 0.09, h * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.68, h * 0.46, w * 0.09, h * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (mood === "think") {
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.42);
    g.addColorStop(0, "rgba(0,0,0,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h * 0.42);
  }
  if (mood === "fold") {
    ctx.fillStyle = "rgba(8, 8, 10, 0.28)";
    ctx.fillRect(0, 0, w, h);
  }
  if (mood === "fire") {
    ctx.fillStyle = "rgba(180, 70, 40, 0.1)";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = "source-over";
}

function useMoodPortrait(url: string, mood: Mood) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let dead = false;
    const im = new Image();
    im.onload = () => {
      if (!dead) setImg(im);
    };
    im.src = url;
    return () => {
      dead = true;
    };
  }, [url]);

  useEffect(() => {
    if (!img) return;
    const c = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = c;
    const h = 640;
    const w = Math.max(8, Math.round((img.width / img.height) * h));
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    paintMood(ctx, img, mood, w, h);
    if (!texRef.current) {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.premultiplyAlpha = false;
      texRef.current = t;
      setTexture(t);
    } else {
      texRef.current.needsUpdate = true;
      setTexture(texRef.current);
    }
  }, [img, mood]);

  useEffect(
    () => () => {
      texRef.current?.dispose();
      texRef.current = null;
    },
    [],
  );

  return { texture, aspect: img ? img.width / img.height : 0.68 };
}

function Chair() {
  return (
    <group position={[0, 0, -0.16]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.07, 0.42]} />
        <meshStandardMaterial color="#1a1612" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.58, -0.2]} castShadow>
        <boxGeometry args={[0.5, 0.68, 0.07]} />
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
      l.current.rotation.z = acting ? 0.12 : 0.04;
    }
    if (r.current) {
      r.current.position.y = 0.13 + (acting ? Math.abs(Math.sin(t * 10 + 0.9)) * 0.05 : tap * 0.6) + up;
      r.current.rotation.x = rot;
      r.current.rotation.z = acting ? -0.12 : -0.04;
    }
  });
  return (
    <>
      <group ref={l} position={[-0.15, 0.13, 0.2]}>
        <mesh rotation={[1.05, 0.2, 0.1]} castShadow>
          <capsuleGeometry args={[0.032, 0.16, 4, 8]} />
          <meshStandardMaterial color={jacket} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.11, 0.05]} castShadow>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
      </group>
      <group ref={r} position={[0.15, 0.13, 0.2]}>
        <mesh rotation={[1.05, -0.2, -0.1]} castShadow>
          <capsuleGeometry args={[0.032, 0.16, 4, 8]} />
          <meshStandardMaterial color={jacket} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.11, 0.05]} castShadow>
          <sphereGeometry args={[0.038, 10, 10]} />
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
  talking,
}: {
  player: SeatPlayer;
  acting: boolean;
  winning: boolean;
  talking?: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const lean = useRef(0);
  const bob = useRef(0);
  const [x, , z] = visPos(player.seat);
  const mood = moodOf(player, acting, winning);
  const { texture, aspect } = useMoodPortrait(player.face, mood);
  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const fidget =
    player.style === "maniac" ? 1.7 : player.style === "lag" ? 1.25 : player.style === "nit" ? 0.5 : 1;
  const h = player.seat === 3 ? 1.12 : 1.02;
  const w = h * Math.min(0.8, Math.max(0.56, aspect));

  useFrame((state, dt) => {
    const m = root.current;
    if (!m) return;
    const d = Math.min(dt, 0.1);
    const t = state.clock.elapsedTime + player.seat * 1.7;
    const targetLean = winning ? 0.06 : acting ? 0.22 : player.folded ? -0.14 : 0;
    const k = 1 - Math.exp(-7 * d);
    lean.current += (targetLean - lean.current) * k;
    if (reduce) {
      m.position.y = winning ? 0.05 : 0;
      m.position.z = lean.current;
      m.rotation.z = 0;
      m.rotation.x = player.folded ? -0.08 : 0;
      m.scale.setScalar(player.folded ? 0.96 : 1);
      return;
    }
    const breathe = Math.sin(t * (player.folded ? 0.9 : 1.85) * fidget) * (player.folded ? 0.012 : 0.028);
    const bounce = winning ? Math.abs(Math.sin(t * 6.4)) * 0.12 : 0;
    const sway = Math.sin(t * 0.9 * fidget) * (acting ? 0.07 : 0.022);
    const talk = talking ? Math.sin(t * 16) * 0.018 : 0;
    bob.current = breathe + bounce + talk;
    m.position.y = bob.current;
    m.position.z = lean.current;
    m.rotation.z = sway;
    m.rotation.x = acting ? 0.12 : player.folded ? -0.18 : winning ? -0.05 : Math.sin(t * 0.55) * 0.03;
    const s = player.folded ? 0.93 : winning ? 1.08 : talking ? 1.04 : acting ? 1.05 : 1;
    m.scale.setScalar(s);
  });

  const first = player.name.split(" ")[0] ?? player.name;

  return (
    <group position={[x, 0, z]}>
      <Chair />
      <group ref={root}>
        {texture ? (
          <Billboard follow position={[0, 0.78, 0.02]}>
            <mesh>
              <planeGeometry args={[w, h]} />
              <meshBasicMaterial
                map={texture}
                transparent
                alphaTest={0.14}
                depthWrite
                toneMapped={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </Billboard>
        ) : (
          <mesh position={[0, 0.85, 0]}>
            <capsuleGeometry args={[0.16, 0.5, 6, 10]} />
            <meshStandardMaterial color={player.skin} />
          </mesh>
        )}
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
        {acting ? (
          <>
            <pointLight position={[0, 1.15, 0.35]} intensity={3.2} distance={2} color="#f2e2c0" />
            <ThinkDots />
          </>
        ) : null}
      </group>
      <Html position={[0, -0.04, 0.1]} center style={{ pointerEvents: "none" }}>
        <div className="table-tag">
          <p className="table-tag-name">{first}</p>
          <p className="table-tag-stack">{player.stack.toLocaleString()}</p>
        </div>
      </Html>
    </group>
  );
}

function ThinkDots() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.children.forEach((ch, i) => {
      ch.position.y = Math.abs(Math.sin(t * 6 + i * 0.7)) * 0.05;
    });
  });
  return (
    <group ref={ref} position={[0, 1.38, 0.12]}>
      {[-0.06, 0, 0.06].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial color="#efe8d8" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
