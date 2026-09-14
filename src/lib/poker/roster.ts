import type { SeatPlayer, Style } from "./types";

export const START_STACK = 2500;
export const SMALL_BLIND = 25;
export const BIG_BLIND = 50;

type Spec = {
  name: string;
  style: Style;
  hue: number;
  jacket: string;
  accent: string;
  hair: string;
  skin: string;
  castId: string;
};

export const REGULARS: Spec[] = [
  {
    name: "Nico Vale",
    style: "tag",
    hue: 210,
    jacket: "#1a1c22",
    accent: "#d7dbe3",
    hair: "#1c1c1c",
    skin: "#c58c6a",
    castId: "nico",
  },
  {
    name: "Ruby Chen",
    style: "lag",
    hue: 8,
    jacket: "#4a1d22",
    accent: "#c9a9a4",
    hair: "#1a1210",
    skin: "#e0b089",
    castId: "mira",
  },
  {
    name: "Cal Harrow",
    style: "station",
    hue: 32,
    jacket: "#2a241c",
    accent: "#b9a58a",
    hair: "#6a4a32",
    skin: "#d4a074",
    castId: "omar",
  },
  {
    name: "Mira Sol",
    style: "nit",
    hue: 48,
    jacket: "#ece6dc",
    accent: "#8a7a68",
    hair: "#c9b48a",
    skin: "#f0c8a8",
    castId: "sol",
  },
  {
    name: "Jax Rook",
    style: "maniac",
    hue: 260,
    jacket: "#161616",
    accent: "#9aa0aa",
    hair: "#c8c8c8",
    skin: "#c4a07c",
    castId: "vex",
  },
];

export function faceUrl(castId: string) {
  return `/poker/cast/${castId}.png`;
}

export function makeHero(name: string): SeatPlayer {
  return {
    id: "hero",
    name: name.trim() || "You",
    seat: 0,
    stack: START_STACK,
    bet: 0,
    folded: false,
    allIn: false,
    hole: null,
    acted: false,
    isHero: true,
    isBot: false,
    style: "tag",
    hue: 160,
    jacket: "#14241c",
    accent: "#d7dbe3",
    hair: "#2a221c",
    skin: "#d2a07a",
    face: "",
    castId: "",
    lastAct: null,
  };
}

export function makeBots(): SeatPlayer[] {
  return REGULARS.map((r, i) => ({
    id: `bot-${i}`,
    name: r.name,
    seat: i + 1,
    stack: START_STACK,
    bet: 0,
    folded: false,
    allIn: false,
    hole: null,
    acted: false,
    isHero: false,
    isBot: true,
    style: r.style,
    hue: r.hue,
    jacket: r.jacket,
    accent: r.accent,
    hair: r.hair,
    skin: r.skin,
    face: faceUrl(r.castId),
    castId: r.castId,
    lastAct: null,
  }));
}

export const STYLE_LABEL: Record<Style, string> = {
  nit: "Rock",
  tag: "Sharp",
  lag: "Pressure",
  station: "Caller",
  maniac: "Heat",
};
