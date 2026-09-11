import type { ActionKind } from "./types";

const LINES: Record<string, string[]> = {
  fold: ["I'm out.", "Not this street.", "Pass."],
  check: ["Check.", "See the next one.", "Free look."],
  call: ["Call.", "I'll see it.", "Stay in."],
  raise: ["Raise.", "Let's go.", "Too cheap."],
  allin: ["All of it.", "Put me in.", "Ship it."],
};

export function tableLine(kind: ActionKind): string {
  const pool = LINES[kind] || LINES.check;
  return pool[Math.floor(Math.random() * pool.length)]!;
}
