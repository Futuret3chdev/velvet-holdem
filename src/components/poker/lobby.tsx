import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { REGULARS, STYLE_LABEL } from "@/lib/poker/roster";
import { loadSavedName, usePoker } from "@/lib/poker/store";
import { unlockAudio } from "@/lib/poker/audio";

export function Lobby() {
  const sit = usePoker((s) => s.sit);
  const [name, setName] = useState("");
  useEffect(() => {
    setName(loadSavedName());
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="max-w-lg">
        <p className="text-xs uppercase tracking-widest text-subtle">Private room · six-max · live</p>
        <h1 className="font-display mt-1 text-4xl leading-none text-fg sm:text-5xl">Velvet Hold'em</h1>
      </header>
      <div className="pointer-events-auto mx-auto w-full max-w-lg rounded-2xl bg-surface/95 p-4 shadow-[var(--shadow-border)]">
        <p className="text-sm leading-relaxed text-muted">
          Five CGI regulars are already online. The empty chair is yours.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {REGULARS.map((r) => (
            <li key={r.name} className="rounded-lg bg-elevated px-3 py-2">
              <p className="text-sm font-medium text-fg">{r.name}</p>
              <p className="text-xs text-muted">
                <span className="online-dot" /> Online · {STYLE_LABEL[r.style]}
              </p>
            </li>
          ))}
        </ul>
        <form
          className="mt-4 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            unlockAudio();
            sit(name);
          }}
        >
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wide text-subtle">Your name at the table</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              maxLength={18}
              autoComplete="nickname"
              className="h-12 rounded-xl bg-elevated px-4 text-base text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/70"
            />
          </label>
          <Button type="submit" className="h-12 rounded-xl">
            Sit down
          </Button>
        </form>
      </div>
    </div>
  );
}
