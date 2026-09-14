import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { usePoker } from "@/lib/poker/store";
import { Hud } from "./hud";
import { Lobby } from "./lobby";
import { LobbyScene, TableScene } from "./table-scene";

export function GameApp() {
  const screen = usePoker((s) => s.screen);
  const lobby = screen === "lobby";
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      <Canvas
        className={
          lobby
            ? "absolute inset-x-0 top-16 bottom-60 touch-none sm:top-12 sm:bottom-52"
            : "absolute inset-x-0 top-28 bottom-48 touch-none sm:top-24 sm:bottom-40"
        }
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.12, 2.15], fov: 40, near: 0.08, far: 24 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          camera.lookAt(0, 0.7, -0.4);
        }}
      >
        {lobby ? <LobbyScene /> : <TableScene />}
      </Canvas>
      {lobby ? <Lobby /> : <Hud />}
    </div>
  );
}
