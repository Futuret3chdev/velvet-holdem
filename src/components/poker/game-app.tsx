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
        className="absolute inset-0 touch-none"
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.08, 1.92], fov: 55, near: 0.05, far: 28 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          camera.lookAt(0, 0.76, -0.42);
        }}
      >
        {lobby ? <LobbyScene /> : <TableScene />}
      </Canvas>
      {lobby ? <Lobby /> : <Hud />}
    </div>
  );
}
