// Headless end-to-end check for v3: simulate a client with a known taste doing
// the best–worst grid flow, and confirm (a) the profile recovers the planted
// preference and (b) confidence-based stopping converges in few screens.
import { REFERENCES } from "../src/data/references";
import { ELO_BASE, updateElo } from "../src/lib/elo";
import { pickSet } from "../src/lib/pairing";
import { fitUtilityModel } from "../src/lib/utility";
import { buildProfile } from "../src/lib/profile";
import { AXIS_IDS } from "../src/lib/axes";
import type { Comparison, Strength } from "../src/types";

// Planted taste: airy, minimal, muted, cool, rounded, refined (≈ "Soft Minimal").
const TARGET: Record<string, number> = {
  tone: -60, density: -55, complexity: -65, saturation: -40, temperature: -15,
  cornerSoftness: 55, depth: 15, typeContrast: -10, typePersonality: -30,
  geometry: 20, gridStrictness: -40, brutalism: -70,
};
const score = (id: string) => {
  const r = REFERENCES.find((x) => x.id === id)!;
  let d = 0;
  for (const a of AXIS_IDS) d += (r.axes[a] - TARGET[a]) ** 2;
  return -Math.sqrt(d);
};
// Box–Muller noise to simulate an imperfect human judge.
const noise = (sd: number) => sd * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());

function replay(comps: Comparison[]): Map<string, Strength> {
  const s = new Map<string, Strength>(REFERENCES.map((r) => [r.id, { id: r.id, elo: ELO_BASE, bt: 0, comparisons: 0, wins: 0 }]));
  for (const c of comps) {
    const w = s.get(c.winner)!, l = s.get(c.loser)!;
    const [nw, nl] = updateElo(w.elo, l.elo, true);
    w.elo = nw; l.elo = nl; w.comparisons++; l.comparisons++; w.wins++;
  }
  return s;
}

const GRID_N = 4, MIN = 6, MAX = 26, TARGET_CONF = 0.85;
const comps: Comparison[] = [];
let lastIds: string[] = [];
let screens = 0;
const traj: number[] = [];

while (true) {
  const set = pickSet(REFERENCES, replay(comps), GRID_N, lastIds);
  const scored = set.map((r) => ({ id: r.id, s: score(r.id) + noise(40) }));
  scored.sort((a, b) => b.s - a.s);
  const best = scored[0].id;
  const worst = scored[scored.length - 1].id;
  const ts = screens;
  for (const r of set) if (r.id !== best) comps.push({ winner: best, loser: r.id, ts });
  for (const r of set) if (r.id !== best && r.id !== worst) comps.push({ winner: r.id, loser: worst, ts });
  lastIds = set.map((r) => r.id);
  screens++;

  const m = comps.length >= 8 ? fitUtilityModel(REFERENCES, comps) : null;
  const conf = m?.confidence ?? 0;
  traj.push(Math.round(conf * 100) / 100);
  if (screens >= MAX || (screens >= MIN && conf >= TARGET_CONF)) break;
}

const strengths = replay(comps);
const profile = buildProfile(REFERENCES, comps, strengths, [], "Verify v3");
const byId = new Map(REFERENCES.map((r) => [r.id, r]));

console.log(`Stopped after ${screens} screens (${comps.length} implied comparisons).`);
console.log(`Confidence trajectory: ${traj.join(" ")}`);
console.log(`Final weight SE: ${fitUtilityModel(REFERENCES, comps).se}`);

console.log("\n=== Driver sign agreement (top 6 vs planted target) ===");
let dHit = 0, dChk = 0;
for (const d of profile.drivers.slice(0, 6)) {
  const t = TARGET[d.id];
  const ok = Math.abs(t) < 18 || Math.sign(d.weight) === Math.sign(t);
  if (Math.abs(t) >= 18) { dChk++; if (ok) dHit++; }
  console.log(`${d.id.padEnd(16)} w=${d.weight.toFixed(2).padStart(6)} imp=${d.importance.toFixed(2)} target=${String(t).padStart(4)} ${ok ? "ok" : "MISS"}`);
}

let agree = 0;
for (const s of profile.axes) if (Math.sign(s.value) === Math.sign(TARGET[s.id]) || Math.abs(TARGET[s.id]) < 18) agree++;
console.log(`\nAxis direction agreement: ${agree}/${profile.axes.length}`);
console.log(`Driver sign agreement: ${dHit}/${dChk}`);
console.log(`Pick consistency: ${profile.consistency}`);
console.log(`Emulate: ${profile.emulate.map((id) => byId.get(id)!.name).join(", ")}`);

if (screens > MAX - 1) console.error("\nWARN: hit max screens without confidence target");
if (agree < 9) { console.error("FAIL: weak axis recovery"); process.exit(1); }
if (dHit < dChk - 1) { console.error("FAIL: conjoint drivers don't match planted preference"); process.exit(1); }
console.log("\nPASS");
