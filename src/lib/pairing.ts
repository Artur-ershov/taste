import type { Reference, Strength } from "../types";

/**
 * Adaptive-ish pair selection. Two cheap heuristics that together beat random
 * pairing without the machinery of full active learning (Crowd-BT / ASAP):
 *
 *  1. Coverage — surface the least-compared items first, so every reference
 *     gets enough exposure for a stable strength estimate.
 *  2. Informativeness — pair items with *similar* current Elo ("uncertain
 *     neighbours"): comparisons between close items carry the most signal.
 */
export function nextPair(
  refs: Reference[],
  strengths: Map<string, Strength>,
  lastPair: [string, string] | null,
): [Reference, Reference] {
  const comps = (id: string) => strengths.get(id)?.comparisons ?? 0;
  const elo = (id: string) => strengths.get(id)?.elo ?? 1500;

  // A = a least-compared item (random tiebreak).
  const minComps = Math.min(...refs.map((r) => comps(r.id)));
  const aPool = refs.filter((r) => comps(r.id) <= minComps + 1);
  const a = aPool[Math.floor(Math.random() * aPool.length)];

  // B = lowest "cost": few comparisons + close in Elo, with a little jitter,
  // never an immediate exact repeat of the previous pair.
  let best: Reference | null = null;
  let bestScore = Infinity;
  for (const r of refs) {
    if (r.id === a.id) continue;
    if (lastPair && isSamePair([a.id, r.id], lastPair)) continue;
    const score =
      comps(r.id) +
      Math.abs(elo(a.id) - elo(r.id)) / 160 +
      Math.random() * 0.75;
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
