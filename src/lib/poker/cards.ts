import type { Card, Rank, Suit } from "./types";

export const SUITS = ["s", "h", "d", "c"] as const;
export const SUIT_GLYPH = ["♠", "♥", "♦", "♣"] as const;
export const RANK_GLYPH: Record<number, string> = {
  14: "A",
  13: "K",
  12: "Q",
  11: "J",
  10: "10",
  9: "9",
  8: "8",
  7: "7",
  6: "6",
  5: "5",
  4: "4",
  3: "3",
  2: "2",
};

export function makeDeck(): Card[] {
  const d: Card[] = [];
  for (let s = 0 as Suit; s < 4; s = (s + 1) as Suit) {
    for (let r = 2 as Rank; r <= 14; r = (r + 1) as Rank) d.push({ r, s });
  }
  return d;
}

export function shuffle(deck: Card[], rng = Math.random): Card[] {
  const a = deck.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i];
    a[i] = a[j]!;
    a[j] = t!;
  }
  return a;
}

export function cardKey(c: Card) {
  return `${c.r}${SUITS[c.s]}`;
}

export function cardLabel(c: Card) {
  return `${RANK_GLYPH[c.r]}${SUIT_GLYPH[c.s]}`;
}

export function isRed(c: Card) {
  return c.s === 1 || c.s === 2;
}
