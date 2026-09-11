export type Suit = 0 | 1 | 2 | 3;
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type Card = { r: Rank; s: Suit };

export type Street = "preflop" | "flop" | "turn" | "river" | "showdown";

export type ActionKind = "fold" | "check" | "call" | "raise" | "allin";

export type Style = "nit" | "tag" | "lag" | "station" | "maniac";

export type SeatPlayer = {
  id: string;
  name: string;
  seat: number;
  stack: number;
  bet: number;
  folded: boolean;
  allIn: boolean;
  hole: [Card, Card] | null;
  acted: boolean;
  isHero: boolean;
  isBot: boolean;
  style: Style;
  hue: number;
  jacket: string;
  accent: string;
  hair: string;
  skin: string;
};

export type Table = {
  players: SeatPlayer[];
  dealer: number;
  street: Street;
  community: Card[];
  deck: Card[];
  pot: number;
  toCall: number;
  minRaise: number;
  toAct: number;
  lastAggressor: number;
  hand: number;
  log: string[];
  winners: string[];
  winLabel: string;
  boardRevealed: number;
};

export type Legal = {
  fold: boolean;
  check: boolean;
  call: boolean;
  callAmt: number;
  raise: boolean;
  minRaiseTo: number;
  maxRaiseTo: number;
};
