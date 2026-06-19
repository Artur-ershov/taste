import type { Reference, Strength } from "../types";
import type { UtilityModel } from "./utility";
import { AXIS_IDS } from "./axes";

/**
 * Adaptive pair selection. Combines:
 *
 *  1. Coverage — surface the least-compared items first, so every reference
 *     gets enough exposure for a stable strength estimate.
 *  2. Informativeness — once the conjoint model is trained (v2), prefer the
 *     pair the model is most *uncertain* about (predicted P closest to 0.5):
 *     that decision carries the most information. Before the model is trained
 *     we fall back to the v1 heuristic of pairing similar-Elo "neighbours".
 */
export function nextPair(
  refs: Reference[],
  strengths: Map<string, Strength>,
  lastPair: [string, string] | null,
  model?: UtilityModel | null,
): [Reference, Reference] {
  const comps = (id: string) => strengths.get(id)?.comparisons ?? 0;
  const elo = (id: string) => strengths.get(id)?.elo ?? 1500;
  const trained = !!model?.trained;

  // A = a least-compared item (random tiebreak).
  const minComps = Math.min(...refs.map((r) => comps(r.id)));
  const aPool = refs.filter((r) => comps(r.id) <= minComps + 1);
  const a = aPool[Math.floor(Math.random() * aPool.length)];

  // B = lowest "cost": few comparisons, high model uncertainty (info gain),
  // and (pre-training) close in Elo. Never an immediate exact repeat.
  const eloWeight = trained ? 0.4 : 1;
  let best: Reference | null = null;
  let bestScore = Infinity;
  for (const r of refs) {
    if (r.id === a.id) continue;
    if (lastPair && isSamePair([a.id, r.id], lastPair)) continue;
    const uncertainty = trained ? 1 - Math.abs(model!.prob(a.axes, r.axes) - 0.5) * 2 : 0;
    const score =
      comps(r.id) +
      (eloWeight * Math.abs(elo(a.id) - elo(r.id))) / 160 -
      1.4 * uncertainty +
      Math.random() * 0.6;
    if (score < bestScore) {
      bestScore = score;
      best = r;
    }
  }
  const b = best ?? refs.find((r) => r.id !== a.id)!;

  // Randomize left/right so position can't bias the result.
  return Math.random() < 0.5 ? [a, b] : [b, a];
}

function isSamePair(x: [string, string], y: [string, string]): boolean {
  return (x[0] === y[0] && x[1] === y[1]) || (x[0] === y[1] && x[1] === y[0]);
}

/** Suggested number of comparisons: ~6 appearances per reference. */
export function suggestedRounds(referenceCount: number): number {
  return Math.round((referenceCount * 6) / 2);
}

const axisDist = (a: Reference, b: Reference) => {
  let s = 0;
  for (const ax of AXIS_IDS) s += (a.axes[ax] - b.axes[ax]) ** 2;
  return Math.sqrt(s);
};

/**
 * Pick a grid of `n` references for a best–worst screen (v3). Each screen
 * yields ~(2n−3) implied pairwise constraints, so we want sets that are both
 * under-sampled (coverage) and visually diverse (max-min spread in axis space),
 * which makes the "most / least" choice carry the most information.
 */
export function pickSet(
  refs: Reference[],
  strengths: Map<string, Strength>,
  n: number,
  lastSetIds: string[] = [],
): Reference[] {
  const comps = (id: string) => strengths.get(id)?.comparisons ?? 0;
  const pool = [...refs].sort(
    (a, b) => comps(a.id) - comps(b.id) + (Math.random() - 0.5) * 1.5,
  );
  const candidates = pool.slice(0, Math.min(refs.length, Math.max(n * 3, n + 4)));

  const chosen: Reference[] = [candidates[0]];
  while (chosen.length < n && chosen.length < candidates.length) {
    let best: Reference | null = null;
    let bestScore = -Infinity;
    for (const c of candidates) {
      if (chosen.includes(c)) continue;
      const minD = Math.min(...chosen.map((ch) => axisDist(ch, c)));
      const score = minD - comps(c.id) * 4 + Math.random() * 10;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (!best) break;
    chosen.push(best);
  }

  // Avoid repeating the previous screen verbatim.
  const sameAsLast =
    lastSetIds.length === chosen.length && chosen.every((c) => lastSetIds.includes(c.id));
  if (sameAsLast && refs.length > n) {
    const alt = pool.find((r) => !chosen.includes(r));
    if (alt) chosen[chosen.length - 1] = alt;
  }

  // Shuffle display order so position carries no signal.
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen.slice(0, n);
}
