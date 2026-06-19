// Headless end-to-end check: simulate a client with a known taste, run a full
// session through the real pairing/Elo/BT/profile/token/brief code, and confirm
// the synthesized profile recovers the planted preference.
import { REFERENCES } from "../src/data/references";
import { ELO_BASE, updateElo } from "../src/lib/elo";
import { nextPair } from "../src/lib/pairing";
import { buildProfile } from "../src/lib/profile";
import { buildTokens } from "../src/lib/tokens";
import { buildBriefText, buildSkillMd } from "../src/lib/brief";
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
  return -Math.sqrt(d); // higher (closer to target) = more preferred
};

const strengths = new Map<string, Strength>(
  REFERENCES.map((r) => [r.id, { id: r.id, elo: ELO_BASE, bt: 0, comparisons: 0, wins: 0 }]),
);
const comparisons: Comparison[] = [];
let last: [string, string] | null = null;
const ROUNDS = 150;
const tau = 22;

for (let i = 0; i < ROUNDS; i++) {
  const [a, b] = nextPair(REFERENCES, strengths, last);
  const p = 1 / (1 + Math.exp(-(score(a.id) - score(b.id)) / tau));
  const aWins = Math.random() < p;
  const winner = aWins ? a.id : b.id;
  const loser = aWins ? b.id : a.id;

  const w = { ...strengths.get(winner)! };
  const l = { ...strengths.get(loser)! };
  const [nw, nl] = updateElo(w.elo, l.elo, true);
  w.elo = nw; l.elo = nl; w.comparisons++; l.comparisons++; w.wins++;
  strengths.set(winner, w); strengths.set(loser, l);
  comparisons.push({ winner, loser, ts: i });
  last = [winner, loser];
}

const profile = buildProfile(REFERENCES, comparisons, strengths, [], "Verify run");
const byId = new Map(REFERENCES.map((r) => [r.id, r]));

console.log("=== Axis recovery (profile vs planted target) ===");
let agree = 0;
for (const s of profile.axes) {
  const t = TARGET[s.id];
  const sameDir = Math.sign(s.value) === Math.sign(t) || Math.abs(t) < 18;
  if (sameDir) agree++;
  console.log(
    `${s.id.padEnd(16)} profile=${String(s.value).padStart(4)}  target=${String(t).padStart(4)}  conf=${s.confidence}  ${sameDir ? "ok" : "MISS"}`,
  );
}
console.log(`\nDirection agreement: ${agree}/${profile.axes.length}`);

console.log("\n=== Emulate (top) ===");
console.log(profile.emulate.map((id) => byId.get(id)!.name).join(", "));
console.log("=== Avoid (bottom) ===");
console.log(profile.avoid.map((id) => byId.get(id)!.name).join(", "));

const { summary } = buildTokens(profile.axes);
console.log("\n=== Tokens summary ===");
console.log(summary);

// hex sanity
const hexOk = /#[0-9a-f]{6}/i.test(summary.background);
console.log("\nbackground hex valid:", hexOk);

console.log("\n=== Brief ===");
console.log(buildBriefText(profile, byId));

console.log("\n=== SKILL.md (head) ===");
console.log(buildSkillMd(profile, byId).split("\n").slice(0, 18).join("\n"));

if (agree < 9) {
  console.error("\nFAIL: weak axis recovery");
  process.exit(1);
}
console.log("\nPASS");
