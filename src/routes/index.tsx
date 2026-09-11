import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/poker/game-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <GameApp />;
}
