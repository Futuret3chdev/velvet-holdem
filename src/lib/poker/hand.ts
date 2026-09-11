import type { Card } from "./types";

const CAT = {
  high: 0,
  pair: 1,
  two: 2,
  trips: 3,
  straight: 4,
  flush: 5,
  boat: 6,
  quads: 7,
  sf: 8,
} as const;

const NAMES = [
  "High card",
  "Pair",
  "Two pair",
  "Three of a kind",
  "Straight",
  "Flush",
  "Full house",
  "Four of a kind",
  "Straight flush",
];

export type Eval = { score: number; name: string; cat: number };

function straightHigh(mask: number): number {
  const m = mask | (mask & (1 << 14) ? 1 << 1 : 0);
  for (let h = 14; h >= 5; h--) {
    let ok = true;
    for (let k = 0; k < 5; k++) if (((m >> (h - k)) & 1) === 0) ok = false;
    if (ok) return h === 5 && (mask & (1 << 14)) && !(mask & (1 << 6)) ? 5 : h;
  }
  return 0;
}

export function eval5(cards: Card[]): Eval {
  const ranks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const suits = [0, 0, 0, 0];
  let mask = 0;
  for (const c of cards) {
    ranks[c.r] += 1;
    suits[c.s] += 1;
    mask |= 1 << c.r;
  }
  const flush = suits.findIndex((n) => n === 5) >= 0;
  const sh = straightHigh(mask);
  const groups: { n: number; r: number }[] = [];
  for (let r = 14; r >= 2; r--) if (ranks[r]) groups.push({ n: ranks[r]!, r });
  groups.sort((a, b) => b.n - a.n || b.r - a.r);

  let cat: number = CAT.high;
  const kick: number[] = [];
  if (flush && sh) {
    cat = CAT.sf;
    kick.push(sh);
  } else if (groups[0]?.n === 4) {
    cat = CAT.quads;
    kick.push(groups[0].r, groups[1]!.r);
  } else if (groups[0]?.n === 3 && groups[1]?.n === 2) {
    cat = CAT.boat;
    kick.push(groups[0].r, groups[1].r);
  } else if (flush) {
    cat = CAT.flush;
    for (let r = 14; r >= 2; r--) if (ranks[r]) kick.push(r);
  } else if (sh) {
    cat = CAT.straight;
    kick.push(sh);
  } else if (groups[0]?.n === 3) {
    cat = CAT.trips;
    kick.push(groups[0].r);
    for (const g of groups.slice(1)) kick.push(g.r);
  } else if (groups[0]?.n === 2 && groups[1]?.n === 2) {
    cat = CAT.two;
    kick.push(groups[0].r, groups[1].r, groups[2]!.r);
  } else if (groups[0]?.n === 2) {
    cat = CAT.pair;
    kick.push(groups[0].r);
    for (const g of groups.slice(1)) kick.push(g.r);
  } else {
    for (const g of groups) kick.push(g.r);
  }
  let score = cat << 24;
  for (let i = 0; i < 5; i++) score |= (kick[i] || 0) << (16 - i * 4);
  const name =
    cat === CAT.sf && kick[0] === 14
      ? "Royal flush"
      : cat === CAT.pair
        ? `Pair of ${face(kick[0]!)}s`
        : cat === CAT.two
          ? `Two pair, ${face(kick[0]!)}s and ${face(kick[1]!)}s`
          : cat === CAT.trips
            ? `Three ${face(kick[0]!)}s`
            : cat === CAT.quads
              ? `Four ${face(kick[0]!)}s`
              : cat === CAT.boat
                ? `${face(kick[0]!)}s full of ${face(kick[1]!)}s`
                : NAMES[cat]!;
  return { score, name, cat };
}

function face(r: number) {
  return r === 14 ? "Ace" : r === 13 ? "King" : r === 12 ? "Queen" : r === 11 ? "Jack" : String(r);
}

export function eval7(cards: Card[]): Eval {
  let best: Eval | null = null;
  const n = cards.length;
  if (n === 5) return eval5(cards);
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++) {
            const ev = eval5([cards[a]!, cards[b]!, cards[c]!, cards[d]!, cards[e]!]);
            if (!best || ev.score > best.score) best = ev;
          }
  return best || eval5(cards.slice(0, 5));
}

export function holeStrength(hole: [Card, Card], board: Card[]): number {
  const all = [...hole, ...board];
  if (board.length === 0) {
    const [a, b] = hole[0].r >= hole[1].r ? hole : [hole[1], hole[0]];
    const pair = a.r === b.r;
    const suited = a.s === b.s;
    const gap = a.r - b.r;
    let s = pair ? 0.62 + a.r / 50 : 0.12 + a.r / 40 + b.r / 80;
    if (suited) s += 0.06;
    if (gap === 1) s += 0.05;
    if (a.r === 14) s += 0.08;
    return Math.min(0.98, s);
  }
  const ev = eval7(all);
  return Math.min(0.99, 0.08 + ev.cat / 9 + ((ev.score >> 16) & 15) / 80);
}
