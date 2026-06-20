// Headless end-to-end check for v3: simulate a client with a known taste doing
// the best–worst grid flow, and confirm (a) the profile recovers the planted
// preference and (b) confidence-based stopping converges in few screens.
import { REFERENCES } from "../src/data/references";
import { ELO_BASE, updateElo } from "../src/lib/elo";
import { pickSet } from "../src/lib/pairing";
import { fitUtilityModel } from "../src/lib/utility";
import { buildProfile } from "../src/lib/profile";
import { AXIS_IDS } from "../src/lib/axes";
import { buildPalette } from "../src/lib/render";
import type { AxisVector, Comparison, Strength } from "../src/types";

// ---- Stimulus-set audit (v4): the set must be balanced + decorrelated so a
// preference can be attributed to the axis that caused it, not to "niceness". ----
{
  const col = (a: string) => REFERENCES.map((r) => r.axes[a as keyof AxisVector]);
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const corr = (xs: number[], ys: number[]) => {
    const mx = mean(xs), my = mean(ys);
    let n = 0, dx = 0, dy = 0;
    for (let i = 0; i < xs.length; i++) { n += (xs[i]-mx)*(ys[i]-my); dx += (xs[i]-mx)**2; dy += (ys[i]-my)**2; }
    return n / (Math.sqrt(dx*dy) || 1);
  };
  let maxR = 0;
  for (let i = 0; i < AXIS_IDS.length; i++)
    for (let j = i + 1; j < AXIS_IDS.length; j++)
      maxR = Math.max(maxR, Math.abs(corr(col(AXIS_IDS[i]), col(AXIS_IDS[j]))));
  let maxSkew = 0, tcLow = 0;
  for (const a of AXIS_IDS) {
    const xs = col(a);
    const lo = xs.filter((x) => x <= -25).length, hi = xs.filter((x) => x >= 25).length;
    maxSkew = Math.max(maxSkew, Math.abs(lo - hi));
    if (a === "typeContrast") tcLow = lo;
  }
  const lum = (h: string) => { const z = [1,3,5].map((i)=>parseInt(h.slice(i,i+2),16)/255).map((c)=> c<=0.03928? c/12.92 : ((c+0.055)/1.055)**2.4); return 0.2126*z[0]+0.7152*z[1]+0.0722*z[2]; };
  const ratio = (a: string, b: string) => { const l1=lum(a), l2=lum(b); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };
  let worstText = 99, worstBtn = 99;
  for (const r of REFERENCES) {
    const p = buildPalette(r.axes);
    worstText = Math.min(worstText, ratio(p.text.hex, p.bg.hex));
    worstBtn = Math.min(worstBtn, ratio(p.primaryFg.hex, p.primary.hex));
  }
  console.log(`=== Stimulus set: ${REFERENCES.length} refs ===`);
  console.log(`max |axis correlation| = ${maxR.toFixed(2)} (want < 0.40)`);
  console.log(`worst axis low/high skew = ${maxSkew} ; typeContrast low examples = ${tcLow}`);
  console.log(`worst contrast — body ${worstText.toFixed(1)}:1, button ${worstBtn.toFixed(1)}:1\n`);
  if (maxR >= 0.4) { console.error("FAIL: axes too correlated"); process.exit(1); }
  if (tcLow < 5) { console.error("FAIL: typeContrast under-covered"); process.exit(1); }
  if (worstText < 4.5 || worstBtn < 2.8) { console.error("FAIL: a reference has poor contrast"); process.exit(1); }
}

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
const gauss = () => Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());

function replay(comps: Comparison[]): Map<string, Strength> {
  const s = new Map<string, Strength>(REFERENCES.map((r) => [r.id, { id: r.id, elo: ELO_BASE, bt: 0, comparisons: 0, wins: 0 }]));
  for (const c of comps) {
    const w = s.get(c.winner)!, l = s.get(c.loser)!;
    const [nw, nl] = updateElo(w.elo, l.elo, true);
    w.elo = nw; l.elo = nl; w.comparisons++; l.comparisons++; w.wins++;
  }
  return s;
}

const GRID_N = 4, MIN = 10, MAX = 26, TARGET_CONF = 0.85;

function runSim(noiseSd: number) {
  const comps: Comparison[] = [];
  let lastIds: string[] = [];
  let screens = 0;
  while (true) {
    const set = pickSet(REFERENCES, replay(comps), GRID_N, lastIds);
    const scored = set.map((r) => ({ id: r.id, s: score(r.id) + noiseSd * gauss() }));
    scored.sort((a, b) => b.s - a.s);
    const best = scored[0].id, worst = scored[scored.length - 1].id;
    for (const r of set) if (r.id !== best) comps.push({ winner: best, loser: r.id, ts: screens });
    for (const r of set) if (r.id !== best && r.id !== worst) comps.push({ winner: r.id, loser: worst, ts: screens });
    lastIds = set.map((r) => r.id);
    screens++;
    const m = comps.length >= 8 ? fitUtilityModel(REFERENCES, comps) : null;
    if (screens >= MAX || (screens >= MIN && (m?.confidence ?? 0) >= TARGET_CONF)) break;
  }
  const profile = buildProfile(REFERENCES, comps, replay(comps), [], "Verify v4");
  let agree = 0;
  for (const s of profile.axes) if (Math.sign(s.value) === Math.sign(TARGET[s.id]) || Math.abs(TARGET[s.id]) < 18) agree++;
  let dHit = 0, dChk = 0;
  for (const d of profile.drivers.slice(0, 6)) {
    const t = TARGET[d.id];
    if (Math.abs(t) >= 18) { dChk++; if (Math.sign(d.weight) === Math.sign(t)) dHit++; }
  }
  return { screens, comps: comps.length, agree, dHit, dChk, consistency: profile.consistency };
}

// Average over a few seeds per user type (decisive vs noisy) to show adaptivity.
function summarize(label: string, noiseSd: number, runs = 6) {
  const rs = Array.from({ length: runs }, () => runSim(noiseSd));
  const avg = (f: (r: ReturnType<typeof runSim>) => number) => rs.reduce((s, r) => s + f(r), 0) / runs;
  const minAgree = Math.min(...rs.map((r) => r.agree));
  const minDriver = Math.min(...rs.map((r) => r.dHit - (r.dChk - 1)));
  console.log(
    `${label.padEnd(20)} screens≈${avg((r) => r.screens).toFixed(1)} ` +
      `axes≈${avg((r) => r.agree).toFixed(1)}/12 (min ${minAgree}) ` +
      `drivers ok=${minDriver >= 0} consistency≈${avg((r) => r.consistency).toFixed(2)}`,
  );
  return { avgScreens: avg((r) => r.screens), minAgree, minDriver };
}

// The confidence meter tracks information collected (estimate precision), not
// user decisiveness — so both user types settle in a similar handful of screens.
console.log("=== Stopping (meter = information collected; settles in ~MIN screens) ===");
const decisive = summarize("decisive (sd 35)", 35);
const noisy = summarize("noisy (sd 80)", 80);

if (decisive.minAgree < 9) { console.error("FAIL: weak axis recovery (decisive)"); process.exit(1); }
if (decisive.minDriver < 0) { console.error("FAIL: drivers don't match planted preference"); process.exit(1); }
if (decisive.avgScreens >= MAX || noisy.avgScreens >= MAX) { console.error("FAIL: profile never settled (ran to max)"); process.exit(1); }
console.log("\nPASS");
