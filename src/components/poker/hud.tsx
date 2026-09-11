import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BIG_BLIND, STYLE_LABEL } from "@/lib/poker/roster";
import { legal } from "@/lib/poker/engine";
import { usePoker } from "@/lib/poker/store";
import { PlayingCard } from "./playing-card";

function money(n: number) {
  return n.toLocaleString();
}

export function Hud() {
  const table = usePoker((s) => s.table);
  const raiseTo = usePoker((s) => s.raiseTo);
  const act = usePoker((s) => s.act);
  const setRaise = usePoker((s) => s.setRaise);
  const leave = usePoker((s) => s.leave);
  const nextHand = usePoker((s) => s.nextHand);
  const quote = usePoker((s) => s.quote);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const t = usePoker.getState().table;
      if (!t) return;
      const heroSeat = t.players[0]?.seat;
      const cur = heroSeat === t.toAct ? legal(t, heroSeat) : null;
      if (t.street === "showdown" && (e.key === "n" || e.key === "Enter")) {
        usePoker.getState().nextHand();
        return;
      }
      if (!cur) return;
      if (e.key === "f") usePoker.getState().act("fold");
      if (e.key === "c") usePoker.getState().act(cur.check ? "check" : "call");
      if (e.key === "r" && cur.raise) usePoker.getState().act("raise", usePoker.getState().raiseTo);
      if (e.key === "a" && cur.raise) usePoker.getState().act("allin");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!table) return null;
  const hero = table.players[0]!;
  const actor = table.toAct >= 0 ? table.players[table.toAct] : null;
  const L = table.toAct === hero.seat ? legal(table, hero.seat) : null;
  const heroTurn = Boolean(L);
  const clamped = L ? Math.min(L.maxRaiseTo, Math.max(L.minRaiseTo, raiseTo)) : raiseTo;
  const board = table.community.slice(0, table.boardRevealed);
  const won = table.street === "showdown" && table.winners.includes(hero.id);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="pointer-events-auto flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl leading-none tracking-tight text-fg">Velvet Hold'em</p>
          <p className="mt-1 text-xs text-muted">
            {BIG_BLIND / 2}/{BIG_BLIND} · Hand #{table.hand}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={leave}>
          Leave
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-2 text-center">
        {board.length ? (
          <div className="flex gap-1">
            {board.map((c, i) => (
              <PlayingCard key={`${table.hand}-b${i}`} card={c} size="sm" />
            ))}
          </div>
        ) : null}
        <p className="font-mono text-xs uppercase tracking-widest text-subtle">Pot</p>
        <p className="font-display text-4xl leading-none tabular-nums text-fg sm:text-5xl">{money(table.pot)}</p>
        <p className="max-w-sm text-sm text-muted">
          {table.street === "showdown"
            ? `${won ? "You take it" : table.winLabel} · ${table.winLabel}`
            : actor
              ? actor.isHero
                ? "Your action"
                : `${actor.name} to act`
              : table.street}
        </p>
        {quote ? <p className="font-display text-base italic text-fg">{quote}</p> : null}
      </div>

      <div className="pointer-events-auto mx-auto grid w-full max-w-lg gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {table.players.map((p) => (
            <div
              key={p.id}
              className={`min-w-16 flex-1 rounded-lg px-2 py-1.5 ${
                table.toAct === p.seat ? "bg-elevated" : "bg-surface/85"
              }`}
            >
              <p className="truncate text-xs font-medium text-fg">
                {p.isHero ? "You" : p.name.split(" ")[0]}
                {p.folded ? " · out" : ""}
              </p>
              <p className="font-mono text-xs tabular-nums text-muted">{money(p.stack)}</p>
              {!p.isHero ? (
                <p className="text-xs uppercase tracking-wide text-subtle">{STYLE_LABEL[p.style]}</p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex items-end gap-3">
          <div className="flex gap-1">
            {hero.hole?.map((c, i) => (
              <PlayingCard key={`h${i}`} card={c} />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            {table.street === "showdown" ? (
              <Button className="h-12 w-full rounded-xl" onClick={nextHand}>
                {won ? "Take the next" : "Next hand"}
              </Button>
            ) : heroTurn && L ? (
              <div className="grid gap-2">
                {L.raise ? (
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <Slider
                        min={L.minRaiseTo}
                        max={L.maxRaiseTo}
                        step={25}
                        value={clamped}
                        onValueChange={setRaise}
                        aria-label="Raise amount"
                      />
                      <span className="w-14 text-right font-mono text-sm tabular-nums text-fg">
                        {money(clamped)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setRaise(L.minRaiseTo)}>
                        Min
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setRaise(Math.min(L.maxRaiseTo, Math.max(L.minRaiseTo, table.pot + L.callAmt)))
                        }
                      >
                        Pot
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => act("allin")}>
                        All in
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="secondary" className="h-12 rounded-xl" onClick={() => act("fold")}>
                    Fold
                  </Button>
                  {L.check ? (
                    <Button className="h-12 rounded-xl" onClick={() => act("check")}>
                      Check
                    </Button>
                  ) : (
                    <Button className="h-12 rounded-xl" onClick={() => act("call")} disabled={!L.call}>
                      Call {money(L.callAmt)}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl"
                    disabled={!L.raise}
                    onClick={() => act("raise", clamped)}
                  >
                    Raise
                  </Button>
                </div>
              </div>
            ) : (
              <p className="pb-3 text-sm text-muted">Wait for the action to come around.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
