import { useMemo } from "react";
import { ContactShadows } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePoker } from "@/lib/poker/store";
import { makeBots } from "@/lib/poker/roster";
import { seatPos } from "@/lib/poker/seats";
import { Character, EmptyChair } from "./character";
import { CardMesh } from "./card-mesh";

function makeFelt() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0c3328";
  g.fillRect(0, 0, 512, 512);
  const img = g.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    img.data[i] = Math.max(0, img.data[i]! + n);
    img.data[i + 1] = Math.max(0, img.data[i + 1]! + n * 0.9);
    img.data[i + 2] = Math.max(0, img.data[i + 2]! + n * 0.7);
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = "rgba(255,255,255,0.04)";
  g.lineWidth = 2;
  for (let x = -512; x < 1024; x += 48) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 512, 512);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2.2, 1.6);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Lamp() {
  return (
    <group position={[0, 2.85, 0]}>
      <mesh>
        <cylinderGeometry args={[0.035, 0.035, 1.15, 8]} />
        <meshStandardMaterial color="#2a2a2e" metalness={0.65} roughness={0.32} />
      </mesh>
      <mesh position={[0, -0.64, 0]}>
        <coneGeometry args={[0.58, 0.3, 20, 1, true]} />
        <meshStandardMaterial color="#3a342c" side={THREE.DoubleSide} roughness={0.48} />
      </mesh>
      <pointLight position={[0, -0.72, 0]} intensity={16} distance={8.5} color="#f0d9a8" />
    </group>
  );
}

function TableBody() {
  const felt = useMemo(makeFelt, []);
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow scale={[1.18, 1, 0.86]}>
        <cylinderGeometry args={[1.95, 1.95, 0.1, 64]} />
        <meshStandardMaterial map={felt} roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.18, 0.86, 1]} receiveShadow>
        <torusGeometry args={[1.95, 0.085, 12, 64]} />
        <meshStandardMaterial color="#8a7a55" metalness={0.58} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.18, 0.86, 1]}>
        <torusGeometry args={[1.42, 0.012, 8, 64]} />
        <meshStandardMaterial color="#0a241c" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 0.52, 16]} />
        <meshStandardMaterial color="#1c1814" roughness={0.72} />
      </mesh>
    </group>
  );
}

function Room() {
  return (
    <group>
      <mesh position={[0, 1.6, -4.5]} receiveShadow>
        <boxGeometry args={[12, 4.2, 0.22]} />
        <meshStandardMaterial color="#121014" />
      </mesh>
      <mesh position={[-5.4, 1.6, 0]} receiveShadow>
        <boxGeometry args={[0.22, 4.2, 10]} />
        <meshStandardMaterial color="#0e0c10" />
      </mesh>
      <mesh position={[5.4, 1.6, 0]} receiveShadow>
        <boxGeometry args={[0.22, 4.2, 10]} />
        <meshStandardMaterial color="#0e0c10" />
      </mesh>
      <mesh position={[0, 2.4, -4.28]}>
        <boxGeometry args={[1.6, 1.05, 0.04]} />
        <meshStandardMaterial color="#1a1814" />
      </mesh>
      <mesh position={[0, 2.4, -4.25]}>
        <boxGeometry args={[1.42, 0.88, 0.02]} />
        <meshStandardMaterial color="#2a241c" />
      </mesh>
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#0c0b0d" />
      </mesh>
    </group>
  );
}

function ChipStack({
  seat,
  stack,
  radiusX = 1.72,
  radiusZ = 1.28,
}: {
  seat: number;
  stack: number;
  radiusX?: number;
  radiusZ?: number;
}) {
  const [x, , z] = seatPos(seat, 6, radiusX, radiusZ);
  const n = Math.max(1, Math.min(7, Math.round(stack / 420)));
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[x + 0.1, 0.1 + i * 0.026, z]} castShadow>
          <cylinderGeometry args={[0.068, 0.068, 0.024, 16]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#8b2e2e" : i % 3 === 1 ? "#efe8d8" : "#2c4a3a"}
            roughness={0.38}
            metalness={0.12}
          />
        </mesh>
      ))}
    </group>
  );
}

function DealerPuck({ seat }: { seat: number }) {
  const [x, , z] = seatPos(seat, 6, 1.5, 1.12);
  return (
    <mesh position={[x, 0.12, z]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.075, 0.075, 0.018, 20]} />
      <meshStandardMaterial color="#efe8d8" roughness={0.4} />
    </mesh>
  );
}

function PotChips({ pot }: { pot: number }) {
  const n = Math.max(0, Math.min(8, Math.round(pot / 180)));
  if (!n) return null;
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[(i % 3) * 0.08 - 0.08, 0.11 + Math.floor(i / 3) * 0.026, 0.42]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.022, 14]} />
          <meshStandardMaterial color={i % 2 ? "#8b2e2e" : "#efe8d8"} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Aim({ at }: { at: [number, number, number] }) {
  useFrame(({ camera }) => {
    camera.lookAt(at[0], at[1], at[2]);
  });
  return null;
}

function Ticker() {
  useFrame((_, dt) => {
    usePoker.getState().tick(Math.min(dt, 0.1));
  });
  return null;
}

function Lights() {
  return (
    <>
      <color attach="background" args={["#0b0a0c"]} />
      <fog attach="fog" args={["#0b0a0c", 10, 22]} />
      <hemisphereLight args={["#8a8478", "#08070a", 0.7]} />
      <spotLight
        position={[2.4, 5.2, 3.2]}
        intensity={22}
        angle={0.58}
        penumbra={0.65}
        color="#f2e2c0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight position={[-2.2, 3.4, -1.4]} intensity={7} angle={0.75} penumbra={0.8} color="#9aa4b2" />
      <ambientLight intensity={0.18} />
      <Lamp />
    </>
  );
}

export function LobbyScene() {
  const bots = useMemo(() => makeBots(), []);
  return (
    <>
      <Aim at={[0, 0.2, 0]} />
      <Lights />
      <Room />
      <TableBody />
      <EmptyChair seat={0} lit />
      {bots.map((p) => (
        <group key={p.id}>
          <Character player={p} acting={false} winning={false} />
          <ChipStack seat={p.seat} stack={p.stack} />
        </group>
      ))}
      <ContactShadows position={[0, -0.54, 0]} opacity={0.45} scale={12} blur={2.4} far={5} />
    </>
  );
}

export function TableScene() {
  const table = usePoker((s) => s.table);
  if (!table) return null;
  const winners = new Set(table.winners);
  return (
    <>
      <Aim at={[0, 0.35, 0]} />
      <Ticker />
      <Lights />
      <Room />
      <TableBody />
      <DealerPuck seat={table.dealer} />
      <PotChips pot={table.pot} />
      {table.players.map((p) =>
        p.isHero ? (
          <group key={p.id}>
            <EmptyChair seat={p.seat} />
            <ChipStack seat={p.seat} stack={p.stack} />
          </group>
        ) : (
          <group key={p.id}>
            <Character player={p} acting={table.toAct === p.seat} winning={winners.has(p.id)} />
            <ChipStack seat={p.seat} stack={p.stack} />
            {p.hole && !p.folded
              ? p.hole.map((c, i) => {
                  const [x, , z] = seatPos(p.seat, 6, 1.48, 1.12);
                  const a = Math.atan2(x, z);
                  return (
                    <CardMesh
                      key={`${table.hand}-${p.id}-${i}`}
                      card={c}
                      hidden={table.street !== "showdown"}
                      position={[x + Math.cos(a + 0.4) * 0.08 * (i ? 1 : -1), 0.12, z]}
                      rotation={[0, a, 0]}
                    />
                  );
                })
              : null}
          </group>
        ),
      )}
      {table.community.map((c, i) => (
        <CardMesh
          key={`${table.hand}-b${i}`}
          card={c}
          position={[-0.52 + i * 0.26, 0.12, 0.02]}
          hidden={i >= table.boardRevealed}
        />
      ))}
      <ContactShadows position={[0, -0.54, 0]} opacity={0.42} scale={12} blur={2.4} far={5} />
    </>
  );
}
