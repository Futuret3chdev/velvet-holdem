import { makeDeck, shuffle, cardLabel } from "./cards";
import { eval7 } from "./hand";
import { BIG_BLIND, SMALL_BLIND, START_STACK, makeBots, makeHero } from "./roster";
import type { ActionKind, Card, Legal, SeatPlayer, Street, Table } from "./types";

function nextSeat(from: number, n: number) {
  return (from + 1) % n;
}

function live(p: SeatPlayer) {
  return !p.folded && (p.stack > 0 || p.bet > 0 || p.allIn);
}

function canAct(p: SeatPlayer) {
  return !p.folded && !p.allIn && p.stack > 0;
}

function firstToAct(t: Table, after: number) {
  const n = t.players.length;
  let i = nextSeat(after, n);
  for (let k = 0; k < n; k++) {
    if (canAct(t.players[i]!)) return i;
    i = nextSeat(i, n);
  }
  return -1;
}

function pull(t: Table): Card {
  const c = t.deck.pop();
  if (!c) throw new Error("empty deck");
  return c;
}

function takeChips(p: SeatPlayer, amt: number) {
  const take = Math.min(p.stack, Math.max(0, amt));
  p.stack -= take;
  p.bet += take;
  if (p.stack === 0) p.allIn = true;
  return take;
}

function postBlinds(t: Table, seat: number, amt: number) {
  t.pot += takeChips(t.players[seat]!, amt);
}

export function createTable(heroName: string): Table {
  const players = [makeHero(heroName), ...makeBots()];
  const t: Table = {
    players,
    dealer: 0,
    street: "preflop",
    community: [],
    deck: [],
    pot: 0,
    toCall: 0,
    minRaise: BIG_BLIND,
    toAct: 0,
    lastAggressor: -1,
    hand: 0,
    log: [],
    winners: [],
    winLabel: "",
    boardRevealed: 0,
  };
  return newHand(t);
}

export function newHand(t: Table): Table {
  const next: Table = {
    ...t,
    players: t.players.map((p) => ({
      ...p,
      stack: p.stack <= 0 ? START_STACK : p.stack,
      bet: 0,
      folded: false,
      allIn: false,
      hole: null,
      acted: false,
      lastAct: null,
    })),
    street: "preflop",
    community: [],
    deck: shuffle(makeDeck()),
    pot: 0,
    toCall: 0,
    minRaise: BIG_BLIND,
    lastAggressor: -1,
    winners: [],
    winLabel: "",
    boardRevealed: 0,
    hand: t.hand + 1,
    log: [],
  };
  const n = next.players.length;
  next.dealer = nextSeat(t.dealer, n);
  const sb = nextSeat(next.dealer, n);
  const bb = nextSeat(sb, n);
  postBlinds(next, sb, SMALL_BLIND);
  postBlinds(next, bb, BIG_BLIND);
  next.toCall = Math.max(...next.players.map((p) => p.bet));
  next.log = [
    `Hand #${next.hand}`,
    `${next.players[sb]!.name} posts ${SMALL_BLIND}`,
    `${next.players[bb]!.name} posts ${BIG_BLIND}`,
  ];
  for (const p of next.players) {
    p.hole = [pull(next), pull(next)];
  }
  next.toAct = firstToAct(next, bb);
  next.lastAggressor = bb;
  return next;
}

export function legal(t: Table, seat = t.toAct): Legal {
  const p = t.players[seat];
  const empty: Legal = {
    fold: false,
    check: false,
    call: false,
    callAmt: 0,
    raise: false,
    minRaiseTo: 0,
    maxRaiseTo: 0,
  };
  if (!p || t.street === "showdown" || !canAct(p) || seat !== t.toAct) return empty;
  const callAmt = Math.max(0, t.toCall - p.bet);
  const canCheck = callAmt === 0;
  const canCall = callAmt > 0 && p.stack > 0;
  const minRaiseTo = t.toCall + t.minRaise;
  const maxRaiseTo = p.bet + p.stack;
  const canRaise = maxRaiseTo > t.toCall && p.stack > callAmt;
  return {
    fold: true,
    check: canCheck,
    call: canCall,
    callAmt,
    raise: canRaise,
    minRaiseTo: Math.min(minRaiseTo, maxRaiseTo),
    maxRaiseTo,
  };
}

function bettingClosed(t: Table) {
  const acting = t.players.filter(canAct);
  if (acting.length === 0) return true;
  const need = t.toCall;
  return acting.every((p) => p.acted && p.bet === need);
}

function stillIn(t: Table) {
  return t.players.filter((p) => !p.folded);
}

function award(t: Table, ids: string[], label: string): Table {
  const share = Math.floor(t.pot / Math.max(1, ids.length));
  const players = t.players.map((p) =>
    ids.includes(p.id) ? { ...p, stack: p.stack + share } : p,
  );
  const names = ids.map((id) => players.find((p) => p.id === id)?.name).join(", ");
  return {
    ...t,
    players,
    pot: 0,
    street: "showdown",
    winners: ids,
    winLabel: label,
    toAct: -1,
    log: [...t.log, `${names} wins ${share * ids.length} — ${label}`],
  };
}

function nextStreet(t: Table): Table {
  const inHand = stillIn(t);
  if (inHand.length === 1) return award(t, [inHand[0]!.id], "uncontested");
  if (t.street === "river") return showdown(t);

  const street: Street =
    t.street === "preflop" ? "flop" : t.street === "flop" ? "turn" : "river";
  const burn = pull(t);
  void burn;
  const add = street === "flop" ? [pull(t), pull(t), pull(t)] : [pull(t)];
  const players = t.players.map((p) => ({ ...p, bet: 0, acted: p.folded || p.allIn }));
  const next: Table = {
    ...t,
    players,
    street,
    community: [...t.community, ...add],
    boardRevealed: street === "flop" ? 3 : street === "turn" ? 4 : 5,
    toCall: 0,
    minRaise: BIG_BLIND,
    lastAggressor: t.dealer,
    log: [...t.log, street.toUpperCase()],
  };
  if (players.filter(canAct).length <= 1) return nextStreet(next);
  next.toAct = firstToAct(next, next.dealer);
  return next;
}

function showdown(t: Table): Table {
  const contenders = stillIn(t).filter((p) => p.hole);
  const scored = contenders.map((p) => ({
    p,
    ev: eval7([...(p.hole || []), ...t.community]),
  }));
  scored.sort((a, b) => b.ev.score - a.ev.score);
  const top = scored[0]?.ev.score ?? 0;
  const winners = scored.filter((s) => s.ev.score === top);
  const label = winners[0]?.ev.name || "pot";
  const done = award(
    { ...t, boardRevealed: 5, community: t.community },
    winners.map((w) => w.p.id),
    label,
  );
  return { ...done, boardRevealed: 5 };
}

export function applyAction(t: Table, kind: ActionKind, raiseTo = 0): Table {
  if (t.street === "showdown" || t.toAct < 0) return t;
  const seat = t.toAct;
  const p = t.players[seat];
  if (!p || !canAct(p)) return t;
  const L = legal(t, seat);
  const players = t.players.map((x) => ({ ...x }));
  const me = players[seat]!;
  let log = t.log;
  let toCall = t.toCall;
  let minRaise = t.minRaise;
  let lastAggressor = t.lastAggressor;
  let added = 0;

  if (kind === "fold") {
    me.folded = true;
    me.acted = true;
    me.lastAct = "fold";
    log = [...log, `${me.name} folds`];
  } else if (kind === "check" && L.check) {
    me.acted = true;
    me.lastAct = "check";
    log = [...log, `${me.name} checks`];
  } else if (kind === "call" || (kind === "check" && !L.check)) {
    const amt = Math.min(me.stack, Math.max(0, toCall - me.bet));
    added = takeChips(me, amt);
    me.acted = true;
    me.lastAct = amt === 0 ? "check" : "call";
    log = [...log, amt === 0 ? `${me.name} checks` : `${me.name} calls ${amt}`];
  } else {
    let to = kind === "allin" ? me.bet + me.stack : raiseTo;
    to = Math.max(L.minRaiseTo || toCall, Math.min(to, me.bet + me.stack));
    added = takeChips(me, to - me.bet);
    const raised = me.bet > toCall;
    if (raised) {
      minRaise = Math.max(BIG_BLIND, me.bet - toCall);
      toCall = me.bet;
      lastAggressor = seat;
      for (const o of players) if (o.id !== me.id && !o.folded && !o.allIn) o.acted = false;
      me.lastAct = kind === "allin" ? "allin" : "raise";
      log = [...log, `${me.name} raises to ${me.bet}`];
    } else {
      me.lastAct = "call";
      log = [...log, `${me.name} puts in ${added}`];
    }
    me.acted = true;
  }

  const next: Table = {
    ...t,
    players,
    pot: t.pot + added,
    toCall,
    minRaise,
    lastAggressor,
    log,
  };

  const remaining = stillIn(next);
  if (remaining.length === 1) return award(next, [remaining[0]!.id], "uncontested");
  if (bettingClosed(next)) return nextStreet(next);
  next.toAct = firstToAct(next, seat);
  return next;
}

export function holeText(p: SeatPlayer) {
  if (!p.hole) return "";
  return `${cardLabel(p.hole[0])} ${cardLabel(p.hole[1])}`;
}
