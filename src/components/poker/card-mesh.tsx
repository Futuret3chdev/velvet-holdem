import { useMemo } from "react";
import * as THREE from "three";
import { RANK_GLYPH, SUIT_GLYPH, isRed } from "@/lib/poker/cards";
import type { Card } from "@/lib/poker/types";

const cache = new Map<string, THREE.CanvasTexture>();

function tex(card: Card | "back") {
  const key = card === "back" ? "back" : `${card.r}${card.s}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 360;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a1612";
  g.fillRect(0, 0, 256, 360);
  if (card === "back") {
    g.fillStyle = "#14181c";
    g.fillRect(10, 10, 236, 340);
    g.strokeStyle = "#d7c38a";
    g.lineWidth = 6;
    g.strokeRect(22, 22, 212, 316);
    g.fillStyle = "#0f3d2e";
    g.fillRect(38, 38, 180, 284);
    g.strokeStyle = "#c9b48a";
    g.lineWidth = 1.5;
    g.strokeRect(54, 54, 148, 252);
    g.fillStyle = "#efe8d8";
    g.font = "600 48px 'Cormorant Garamond', Georgia, serif";
    g.textAlign = "center";
    g.fillText("VH", 128, 196);
  } else {
    g.fillStyle = "#f6efe2";
    g.fillRect(10, 10, 236, 340);
    const red = isRed(card);
    g.fillStyle = red ? "#9b2c2c" : "#1a1c22";
    const r = RANK_GLYPH[card.r];
    const s = SUIT_GLYPH[card.s];
    g.font = "700 64px Georgia, serif";
    g.textAlign = "left";
    g.fillText(r, 28, 78);
    g.font = "64px Georgia, serif";
    g.fillText(s, 28, 140);
    g.textAlign = "center";
    g.font = "150px Georgia, serif";
    g.fillText(s, 128, 236);
    g.save();
    g.translate(228, 328);
    g.rotate(Math.PI);
    g.font = "700 64px Georgia, serif";
    g.textAlign = "left";
    g.fillText(r, 0, 0);
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  cache.set(key, t);
  return t;
}

export function CardMesh({
  card,
  position,
  rotation,
  scale = 1,
  hidden,
}: {
  card: Card | null;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  hidden?: boolean;
}) {
  const map = useMemo(() => tex(hidden || !card ? "back" : card), [card, hidden]);
  return (
    <mesh position={position} rotation={rotation} scale={[scale, scale, scale]} castShadow>
      <boxGeometry args={[0.23, 0.004, 0.32]} />
      <meshStandardMaterial map={map} roughness={0.42} metalness={0.04} />
    </mesh>
  );
}
