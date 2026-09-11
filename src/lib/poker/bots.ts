import { holeStrength } from "./hand";
import { applyAction, legal } from "./engine";
import type { ActionKind, Table } from "./types";

const STYLE = {
  nit: { open: 0.72, call: 0.68, bluff: 0.04 },
  tag: { open: 0.52, call: 0.48, bluff: 0.1 },
  lag: { open: 0.38, call: 0.4, bluff: 0.18 },
  station: { open: 0.58, call: 0.28, bluff: 0.02 },
  maniac: { open: 0.22, call: 0.32, bluff: 0.28 },
};

export function botDelay(style: keyof typeof STYLE) {
  const base = style === "maniac" ? 0.45 : style === "nit" ? 1.15 : 0.75;
  return base + Math.random() * 1.1;
}

export function chooseBotAction(t: Table): { kind: ActionKind; raiseTo?: number } {
  const p = t.players[t.toAct];
  if (!p || !p.hole) return { kind: "check" };
  const L = legal(t);
  const s = holeStrength(p.hole, t.community);
  const st = STYLE[p.style];
  const open = s > st.open || Math.random() < st.bluff * (1 - s);
  const callOk = s > st.call || L.callAmt / Math.max(1, p.stack) < 0.08 + s * 0.2;

  if (L.raise && open && (s > 0.55 || Math.random() < st.bluff + 0.08)) {
    const span = L.maxRaiseTo - L.minRaiseTo;
    const to = Math.round((L.minRaiseTo + span * (0.15 + s * 0.5)) / 25) * 25;
    return { kind: "raise", raiseTo: Math.min(L.maxRaiseTo, Math.max(L.minRaiseTo, to)) };
  }
  if (L.check && !open) return { kind: "check" };
  if (L.call && callOk) return { kind: "call" };
  if (L.check) return { kind: "check" };
  if (L.fold) return { kind: "fold" };
  return { kind: L.call ? "call" : "check" };
}

export function stepBot(t: Table): Table {
  const p = t.players[t.toAct];
  if (!p?.isBot) return t;
  const a = chooseBotAction(t);
  return applyAction(t, a.kind, a.raiseTo);
}
