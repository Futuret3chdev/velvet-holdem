import type { ActionKind } from "./types";

export type LineKind = ActionKind | "think" | "win" | "deal";

const LINES: Record<string, string[]> = {
  think: ["Hmm.", "One more look.", "Don't love it.", "Alright…", "Let me see.", "Clock's ticking."],
  fold: ["I'm out.", "Not this street.", "Pass.", "Too thin.", "You can have it."],
  check: ["Check.", "See the next one.", "Free look.", "Go on."],
  call: ["Call.", "I'll see it.", "Stay in.", "Fine."],
  raise: ["Raise.", "Let's go.", "Too cheap.", "Make them pay."],
  allin: ["All of it.", "Put me in.", "Ship it.", "I'm not folding this."],
  win: ["Mine.", "That's the one.", "Pay up."],
  deal: ["Cards are in the air.", "Here we go.", "Fresh hand."],
};

export function tableLine(kind: LineKind): string {
  const pool = LINES[kind] || LINES.check;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function spokenText(quote: string, name: string) {
  if (!quote) return "";
  const prefix = `${name}: `;
  if (quote.startsWith(prefix)) return quote.slice(prefix.length);
  if (quote.startsWith(name)) return quote.slice(name.length).replace(/^:\s*/, "");
  return "";
}
