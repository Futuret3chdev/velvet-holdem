let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio() {
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") unlockAudio();
  });
}

function envGain(c: AudioContext, t: number, attack: number, hold: number, release: number, peak: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  return g;
}

export type Sfx = "chip" | "card" | "fold" | "deal" | "win" | "check";

export function playSfx(kind: Sfx) {
  const c = ac();
  if (!c || !master) return;
  if (c.state === "suspended") return;
  const t = c.currentTime;
  const dest = master;

  if (kind === "chip" || kind === "check") {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(kind === "check" ? 520 : 880 + Math.random() * 90, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.08);
    const g = envGain(c, t, 0.004, 0.01, 0.09, 0.45);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + 0.12);
    return;
  }

  if (kind === "card" || kind === "deal") {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(kind === "deal" ? 240 : 190 + Math.random() * 40, t);
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1800;
    f.Q.value = 0.7;
    const g = envGain(c, t, 0.002, 0.012, 0.07, 0.22);
    o.connect(f);
    f.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + 0.1);
    return;
  }

  if (kind === "fold") {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.16);
    const g = envGain(c, t, 0.006, 0.02, 0.14, 0.35);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + 0.2);
    return;
  }

  const a = c.createOscillator();
  const b = c.createOscillator();
  a.type = "sine";
  b.type = "sine";
  a.frequency.setValueAtTime(392, t);
  b.frequency.setValueAtTime(494, t + 0.12);
  const g = envGain(c, t, 0.01, 0.18, 0.28, 0.32);
  a.connect(g);
  b.connect(g);
  g.connect(dest);
  a.start(t);
  b.start(t + 0.1);
  a.stop(t + 0.4);
  b.stop(t + 0.48);
}
