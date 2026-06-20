import type { AxisVector, Reference } from "../types";
import { AXIS_IDS, AXIS_BY_ID } from "../lib/axes";

// The stimulus set (v4). Each reference is rendered *from* this vector, so the
// tags are ground truth. v1–v3 hand-authored coherent archetypes — but those
// bundled correlated traits (e.g. corners↔geometry r=0.91, density↔complexity↔
// saturation ~0.75) and left some axes barely varied (typeContrast had 0 low
// examples), which confounds per-axis attribution and lets trend/"niceness"
// leak in. v4 fixes that: a few realism anchors + a deterministically generated
// fill chosen to BALANCE every axis and DECORRELATE the axes (max |r| ≈ 0.32),
// so a preference can be attributed to the axis that actually caused it.

const clamp = (v: number) => Math.max(-100, Math.min(100, v));

/** Deterministic PRNG so the set is identical on every load/build. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEVELS = [-70, -35, 0, 35, 70];

interface Anchor {
  id: string;
  name: string;
  family: string;
  v: AxisVector;
}

// Coherent, recognizable styles kept for realism (intentionally "typical").
const ANCHORS: Anchor[] = [
  { id: "soft-minimal", name: "Soft Minimal", family: "Soft minimalist",
    v: { tone:-60,density:-55,complexity:-65,saturation:-40,temperature:-15,cornerSoftness:55,depth:15,typeContrast:-10,typePersonality:-30,geometry:20,gridStrictness:-40,brutalism:-70,paletteRichness:-60,gradients:-40,fontWeight:-30,letterCase:-50 } },
  { id: "neo-brutalist", name: "Neo-Brutalist", family: "Neo-brutalist",
    v: { tone:-30,density:30,complexity:35,saturation:70,temperature:35,cornerSoftness:-80,depth:10,typeContrast:60,typePersonality:-10,geometry:-60,gridStrictness:55,brutalism:85,paletteRichness:30,gradients:-70,fontWeight:80,letterCase:70 } },
  { id: "editorial-serif", name: "Editorial Serif", family: "Editorial",
    v: { tone:-50,density:-10,complexity:-10,saturation:-35,temperature:25,cornerSoftness:-40,depth:-20,typeContrast:70,typePersonality:80,geometry:-30,gridStrictness:-20,brutalism:-50,paletteRichness:-40,gradients:-50,fontWeight:20,letterCase:-30 } },
  { id: "dark-techno", name: "Dark Techno", family: "Dark technical",
    v: { tone:70,density:25,complexity:20,saturation:65,temperature:-55,cornerSoftness:-10,depth:50,typeContrast:45,typePersonality:-25,geometry:-45,gridStrictness:-20,brutalism:30,paletteRichness:20,gradients:60,fontWeight:0,letterCase:30 } },
  { id: "corporate-clean", name: "Corporate Clean", family: "Corporate clean",
    v: { tone:-45,density:0,complexity:-20,saturation:0,temperature:-45,cornerSoftness:25,depth:35,typeContrast:20,typePersonality:-45,geometry:-20,gridStrictness:-60,brutalism:-55,paletteRichness:-20,gradients:10,fontWeight:-10,letterCase:-40 } },
  { id: "vivid-maximal", name: "Vivid Maximal", family: "Maximalist",
    v: { tone:-10,density:55,complexity:85,saturation:85,temperature:45,cornerSoftness:40,depth:55,typeContrast:65,typePersonality:55,geometry:50,gridStrictness:45,brutalism:0,paletteRichness:80,gradients:70,fontWeight:40,letterCase:20 } },
  { id: "warm-organic", name: "Warm Organic", family: "Warm organic",
    v: { tone:-35,density:-40,complexity:-15,saturation:-25,temperature:65,cornerSoftness:60,depth:10,typeContrast:30,typePersonality:50,geometry:75,gridStrictness:25,brutalism:-40,paletteRichness:40,gradients:30,fontWeight:-20,letterCase:-50 } },
  { id: "swiss-mono", name: "Swiss Mono", family: "Swiss / International",
    v: { tone:-55,density:10,complexity:-55,saturation:-50,temperature:-10,cornerSoftness:-60,depth:-30,typeContrast:65,typePersonality:-55,geometry:-70,gridStrictness:-75,brutalism:-20,paletteRichness:-70,gradients:-60,fontWeight:30,letterCase:60 } },
];

const colOf = (vs: AxisVector[], a: string) => vs.map((v) => v[a as keyof AxisVector]);
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
function corr(xs: number[], ys: number[]) {
  const mx = mean(xs);
  const my = mean(ys);
  let n = 0, dx = 0, dy = 0;
  for (let i = 0; i < xs.length; i++) {
    n += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return n / (Math.sqrt(dx * dy) || 1);
}
function sumSqCorr(vs: AxisVector[]) {
  let s = 0;
  for (let i = 0; i < AXIS_IDS.length; i++)
    for (let j = i + 1; j < AXIS_IDS.length; j++) {
      const r = corr(colOf(vs, AXIS_IDS[i]), colOf(vs, AXIS_IDS[j]));
      s += r * r;
    }
  return s;
}
function imbalance(vs: AxisVector[]) {
  const ideal = vs.length / 3;
  let p = 0;
  for (const a of AXIS_IDS) {
    const xs = colOf(vs, a);
    const lo = xs.filter((x) => x <= -25).length;
    const hi = xs.filter((x) => x >= 25).length;
    const mid = xs.length - lo - hi;
    p += (lo - ideal) ** 2 + (mid - ideal) ** 2 + (hi - ideal) ** 2;
  }
  return p / (vs.length * vs.length);
}

/** Name a generated reference by its two strongest poles. */
function labelFor(v: AxisVector): string {
  const ranked = AXIS_IDS.map((a) => ({ a, val: v[a] })).sort(
    (x, y) => Math.abs(y.val) - Math.abs(x.val),
  );
  const parts = ranked
    .slice(0, 2)
    .filter((r) => Math.abs(r.val) >= 25)
    .map((r) => (r.val > 0 ? AXIS_BY_ID[r.a].highPole : AXIS_BY_ID[r.a].lowPole));
  return parts.length ? parts.join(" · ") : "Balanced";
}

// Greedy selection: minimize axis correlation + imbalance over the full set.
// Params match the audited sweet spot (max |r| ≈ 0.32, balanced, typeContrast
// covered). Deterministic.
const BALANCE_WEIGHT = 20;
const POOL = 220;
const FILL = 36;

function build(): Reference[] {
  const rng = mulberry32(987654321);
  const pool: AxisVector[] = [];
  for (let i = 0; i < POOL; i++) {
    const v = {} as AxisVector;
    for (const a of AXIS_IDS) v[a] = LEVELS[Math.floor(rng() * LEVELS.length)];
    pool.push(v);
  }

  const vectors: AxisVector[] = ANCHORS.map((a) => ({ ...a.v }));
  const used = new Set<number>();
  for (let k = 0; k < FILL; k++) {
    let best = -1;
    let bestObj = Infinity;
    for (let c = 0; c < pool.length; c++) {
      if (used.has(c)) continue;
      const cand = [...vectors, pool[c]];
      const obj = sumSqCorr(cand) + BALANCE_WEIGHT * imbalance(cand);
      if (obj < bestObj) {
        bestObj = obj;
        best = c;
      }
    }
    used.add(best);
    vectors.push(pool[best]);
  }

  const refs: Reference[] = ANCHORS.map((a) => ({
    id: a.id,
    name: a.name,
    family: a.family,
    axes: { ...a.v },
  }));
  for (let i = 0; i < FILL; i++) {
    const v = vectors[ANCHORS.length + i];
    const axes = {} as AxisVector;
    for (const a of AXIS_IDS) axes[a] = clamp(v[a]);
    refs.push({ id: `mix-${i + 1}`, name: labelFor(axes), family: "Balanced mix", axes });
  }
  return refs;
}

export const REFERENCES: Reference[] = build();
