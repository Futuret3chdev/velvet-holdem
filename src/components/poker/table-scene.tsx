import { useMemo } from "react";
import { ContactShadows } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePoker } from "@/lib/poker/store";
import { makeBots } from "@/lib/poker/roster";
import { chipPos, holePos } from "@/lib/poker/seats";
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

function TableBody() {
  const felt = useMemo(makeFelt, []);
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow scale={[1.05, 1, 0.82]}>
        <cylinderGeometry args={[1.72, 1.72, 0.1, 64]} />
        <meshStandardMaterial map={felt} roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.05, 0.82, 1]} receiveShadow>
        <torusGeometry args={[1.72, 0.08, 12, 64]} />
        <meshStandardMaterial color="#8a7a55" metalness={0.58} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.05, 0.82, 1]}>
        <torusGeometry args={[1.22, 0.012, 8, 64]} />
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
      <mesh position={[0, 1.6, -3.6]} receiveShadow>
        <boxGeometry args={[10, 4.2, 0.22]} />
        <meshStandardMaterial color="#121014" />
      </mesh>
      <mesh position={[-4.4, 1.6, 0]} receiveShadow>
        <boxGeometry args={[0.22, 4.2, 8]} />
        <meshStandardMaterial color="#0e0c10" />
      </mesh>
      <mesh position={[4.4, 1.6, 0]} receiveShadow>
        <boxGeometry args={[0.22, 4.2, 8]} />
        <meshStandardMaterial color="#0e0c10" />
      </mesh>
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#0c0b0d" />
      </mesh>
    </group>
  );
}

function ChipStack({ seat, stack }: { seat: number; stack: number }) {
  const [x, , z] = chipPos(seat);
  const n = Math.max(1, Math.min(7, Math.round(stack / 420)));
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[x + 0.08, 0.1 + i * 0.026, z]} castShadow>
          <cylinderGeometry args={[0.062, 0.062, 0.024, 16]} />
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
  const [x, , z] = chipPos(seat);
  return (
    <mesh position={[x - 0.16, 0.12, z + 0.08]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.07, 0.07, 0.018, 20]} />
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
        <mesh key={i} position={[(i % 3) * 0.075 - 0.075, 0.11 + Math.floor(i / 3) * 0.026, 0.08]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.022, 14]} />
          <meshStandardMaterial color={i % 2 ? "#8b2e2e" : "#efe8d8"} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig({ lobby = false }: { lobby?: boolean }) {
  const size = useThree((s) => s.size);
  useFrame(({ camera }) => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.near = 0.08;
    cam.far = 28;
    cam.clearViewOffset();
    const portrait = size.height / Math.max(1, size.width) > 1.05;
    cam.fov = portrait ? 36 : 32;
    if (lobby) {
      cam.position.set(0, 2.35, 2.7);
      cam.lookAt(0, 0.08, -0.15);
    } else {
      cam.position.set(0, portrait ? 2.45 : 2.2, portrait ? 2.55 : 2.9);
      cam.lookAt(0, 0.06, portrait ? -0.12 : -0.18);
    }
    cam.updateProjectionMatrix();
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
      <fog attach="fog" args={["#0b0a0c", 12, 26]} />
      <hemisphereLight args={["#9a9488", "#08070a", 0.85]} />
      <spotLight
        position={[0.4, 3.6, 2.4]}
        intensity={18}
        angle={0.7}
        penumbra={0.72}
        color="#f2e2c0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight position={[-1.8, 2.6, -0.4]} intensity={9} angle={0.8} penumbra={0.85} color="#c8d0dc" />
      <pointLight position={[0, 1.6, 1.4]} intensity={4.5} distance={6} color="#f0e6d2" />
      <ambientLight intensity={0.28} />
    </>
  );
}

export function LobbyScene() {
  const bots = useMemo(() => makeBots(), []);
  return (
    <>
      <CameraRig lobby />
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
      <ContactShadows position={[0, -0.54, 0]} opacity={0.45} scale={10} blur={2.4} far={5} />
    </>
  );
}

export function TableScene() {
  const table = usePoker((s) => s.table);
  if (!table) return null;
  const winners = new Set(table.winners);
  return (
    <>
      <CameraRig />
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
            <Character
              player={p}
              acting={table.toAct === p.seat}
              winning={winners.has(p.id)}
            />
            <ChipStack seat={p.seat} stack={p.stack} />
            {p.hole && !p.folded
              ? p.hole.map((c, i) => {
                  const [hx, , hz] = holePos(p.seat);
                  return (
                    <CardMesh
                      key={`${table.hand}-${p.id}-${i}`}
                      card={c}
                      hidden={table.street !== "showdown"}
                      position={[hx + (i ? 0.08 : -0.08), 0.12, hz]}
                      rotation={[-0.08, 0, i ? 0.08 : -0.08]}
                      scale={0.85}
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
          position={[-0.52 + i * 0.26, 0.12, 0.22]}
          hidden={i >= table.boardRevealed}
          scale={1.12}
        />
      ))}
      <ContactShadows position={[0, -0.54, 0]} opacity={0.42} scale={10} blur={2.4} far={5} />
    </>
  );
}
