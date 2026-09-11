import { create } from "zustand";
import { applyAction, createTable, legal, newHand } from "./engine";
import { botDelay, stepBot } from "./bots";
import { unlockAudio, playSfx, type Sfx } from "./audio";
import { tableLine } from "./talk";
import type { ActionKind, Table } from "./types";

type Screen = "lobby" | "table";

type PokerState = {
  screen: Screen;
  name: string;
  table: Table | null;
  think: number;
  pause: number;
  raiseTo: number;
  quote: string;
  sit: (name: string) => void;
  act: (kind: ActionKind, raiseTo?: number) => void;
  setRaise: (n: number) => void;
  tick: (dt: number) => void;
  nextHand: () => void;
  leave: () => void;
};

const NAME_KEY = "velvet-holdem-name";

function heroLegal(table: Table | null) {
  if (!table) return null;
  const hero = table.players.find((p) => p.isHero);
  if (!hero || table.toAct !== hero.seat) return null;
  return legal(table, hero.seat);
}

function sfxFor(kind: ActionKind): Sfx {
  if (kind === "fold") return "fold";
  if (kind === "raise" || kind === "allin") return "chip";
  if (kind === "check") return "check";
  return "card";
}

function lastSpeak(prev: Table, next: Table) {
  const line = next.log[next.log.length - 1] || "";
  const actor = prev.players[prev.toAct];
  if (!actor || actor.isHero) return line;
  if (line.includes("folds")) return `${actor.name}: ${tableLine("fold")}`;
  if (line.includes("raises")) return `${actor.name}: ${tableLine("raise")}`;
  if (line.includes("calls")) return `${actor.name}: ${tableLine("call")}`;
  if (line.includes("checks")) return `${actor.name}: ${tableLine("check")}`;
  return line;
}

export const usePoker = create<PokerState>((set, get) => ({
  screen: "lobby",
  name: "",
  table: null,
  think: 0,
  pause: 0,
  raiseTo: 0,
  quote: "",
  sit: (name) => {
    unlockAudio();
    playSfx("deal");
    const n = name.trim() || "You";
    try {
      localStorage.setItem(NAME_KEY, n);
    } catch {
      /* ignore */
    }
    const table = createTable(n);
    const L = heroLegal(table);
    set({
      screen: "table",
      name: n,
      table,
      think: table.players[table.toAct]?.isBot ? botDelay(table.players[table.toAct]!.style) : 0,
      pause: 0,
      raiseTo: L?.minRaiseTo || 0,
      quote: "Cards are in the air.",
    });
  },
  act: (kind, raiseTo) => {
    const { table } = get();
    if (!table) return;
    const hero = table.players.find((p) => p.isHero);
    if (!hero || table.toAct !== hero.seat || table.street === "showdown") return;
    playSfx(sfxFor(kind));
    const next = applyAction(table, kind, raiseTo);
    const actor = next.toAct >= 0 ? next.players[next.toAct] : null;
    const L = heroLegal(next);
    set({
      table: next,
      think: actor?.isBot && next.street !== "showdown" ? botDelay(actor.style) : 0,
      pause: next.street === "showdown" ? 4.4 : 0,
      raiseTo: L?.minRaiseTo || 0,
      quote: next.street === "showdown" ? next.winLabel : next.log[next.log.length - 1] || "",
    });
    if (next.street === "showdown") playSfx("win");
  },
  setRaise: (n) => set({ raiseTo: n }),
  tick: (dt) => {
    const { table, think, pause } = get();
    if (!table) return;
    if (pause > 0) {
      const p = pause - dt;
      if (p <= 0) {
        get().nextHand();
        return;
      }
      set({ pause: p });
      return;
    }
    if (table.street === "showdown") return;
    const actor = table.toAct >= 0 ? table.players[table.toAct] : null;
    if (!actor?.isBot) return;
    const left = think - dt;
    if (left > 0) {
      set({ think: left });
      return;
    }
    const next = stepBot(table);
    playSfx(sfxFor(guessKind(table, next)));
    const nActor = next.toAct >= 0 ? next.players[next.toAct] : null;
    const L = heroLegal(next);
    set({
      table: next,
      think: nActor?.isBot && next.street !== "showdown" ? botDelay(nActor.style) : 0,
      pause: next.street === "showdown" ? 4.4 : 0,
      raiseTo: L?.minRaiseTo || 0,
      quote: next.street === "showdown" ? next.winLabel : lastSpeak(table, next),
    });
    if (next.street === "showdown") playSfx("win");
  },
  nextHand: () => {
    const { table } = get();
    if (!table) return;
    playSfx("deal");
    const next = newHand(table);
    const actor = next.players[next.toAct];
    const L = heroLegal(next);
    set({
      table: next,
      think: actor?.isBot ? botDelay(actor.style) : 0,
      pause: 0,
      raiseTo: L?.minRaiseTo || 0,
      quote: `Hand #${next.hand}`,
    });
  },
  leave: () => set({ screen: "lobby", table: null, think: 0, pause: 0, quote: "" }),
}));

function guessKind(prev: Table, next: Table): ActionKind {
  const line = next.log[next.log.length - 1] || "";
  if (line.includes("folds")) return "fold";
  if (line.includes("raises")) return "raise";
  if (line.includes("calls")) return "call";
  return "check";
}

export function loadSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
}

export { heroLegal };
