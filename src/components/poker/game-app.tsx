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
        key={screen}
        className="absolute inset-0 touch-none"
        shadows
        dpr={[1, 1.5]}
        camera={
          lobby
            ? { position: [0.15, 4.2, 5.6], fov: 38, near: 0.1, far: 40 }
            : { position: [0, 3.55, 5.15], fov: 40, near: 0.1, far: 40 }
        }
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
          camera.lookAt(0, lobby ? 0.15 : 0.35, 0);
        }}
      >
        {lobby ? <LobbyScene /> : <TableScene />}
      </Canvas>
      {lobby ? <Lobby /> : <Hud />}
    </div>
  );
}
