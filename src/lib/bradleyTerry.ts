import type { Comparison } from "../types";

export interface BTResult {
  /** latent strength (positive), geometric-mean-normalized to 1 */
  pi: number;
  /** natural log of strength */
  ln: number;
  /** standardized log-strength (z-score) — the clean, comparable ranking signal */
  z: number;
}

/**
 * Fit a Bradley-Terry model by the MM algorithm (Hunter 2004), with light
 * smoothing so items that won/lost every game stay finite. Recovers usable
 * strengths from sparse data where not every pair was compared directly —
 * which is exactly what keeps the number of swipes low.
 *
 * Smoothing: each item plays `alpha` virtual wins and `alpha` virtual losses
 * against an average (strength-1) opponent.
 */
export function fitBradleyTerry(
  ids: string[],
  comparisons: Comparison[],
  alpha = 1,
  iterations = 250,
): Map<string, BTResult> {
  const n = ids.length;
  const k = new Map(ids.map((id, i) => [id, i]));
  const wins = new Array(n).fill(0);
  // m[i][j] = total games played between i and j (symmetric).
  const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (const c of comparisons) {
    const i = k.get(c.winner);
    const j = k.get(c.loser);
    if (i === undefined || j === undefined) continue;
    wins[i] += 1;
    m[i][j] += 1;
    m[j][i] += 1;
  }

  let pi = new Array(n).fill(1);

  for (let iter = 0; iter < iterations; iter++) {
    const next = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let denom = (2 * alpha) / (pi[i] + 1); // virtual games vs strength-1 opponent
      for (let j = 0; j < n; j++) {
        if (j === i || m[i][j] === 0) continue;
        denom += m[i][j] / (pi[i] + pi[j]);
      }
      next[i] = (wins[i] + alpha) / denom;
    }
    // Normalize to geometric mean 1 for stability.
    let logSum = 0;
    for (let i = 0; i < n; i++) logSum += Math.log(next[i]);
    const gm = Math.exp(logSum / n);
    for (let i = 0; i < n; i++) pi[i] = next[i] / gm;
  }

  const lns = pi.map((p) => Math.log(p));
  const mean = lns.reduce((a, b) => a + b, 0) / n;
  const variance = lns.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance) || 1;

  const out = new Map<string, BTResult>();
  ids.forEach((id, i) => {
    out.set(id, { pi: pi[i], ln: lns[i], z: (lns[i] - mean) / sd });
  });
  return out;
}
