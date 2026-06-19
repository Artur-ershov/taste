import type { AxisId, AxisVector, Comparison, Reference } from "../types";
import { AXIS_IDS } from "./axes";

/**
 * Conjoint / discrete-choice logit model (v2).
 *
 * Models a linear utility u(ref) = Σ_a w_a · x_a (axes scaled to [-1,1]) and
 * fits the weights by maximum likelihood over the pairwise outcomes:
 *   P(i beats j) = sigmoid(u_i − u_j) = sigmoid(Σ_a w_a (x_ia − x_ja)).
 *
 * This is Bradley-Terry *with axis features* — i.e. choice-based conjoint. The
 * fitted weights are the per-axis part-worths: their sign is the preferred
 * pole and their magnitude is how much that axis actually drove the choices.
 * Unlike averaging the tags of liked references, it disentangles axes that
 * happen to co-occur in the stimulus set — the confounding problem head-on.
 */
export interface UtilityModel {
  weights: Record<AxisId, number>;
  importance: Record<AxisId, number>; // |weight| normalized 0..1
  utility: (axes: AxisVector) => number;
  prob: (a: AxisVector, b: AxisVector) => number; // P(a beats b)
  trained: boolean; // false until there's enough signal to be meaningful
  loss: number;
  /** Mean standard error of the weights (from the logit information matrix). */
  se: number;
  /** 0..1 readiness derived from `se` — how settled the part-worths are (v3). */
  confidence: number;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));

/** Invert a square matrix by Gauss-Jordan elimination (small A, fine in JS). */
function invert(m: number[][]): number[][] | null {
  const n = m.length;
  const a = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[piv][col])) piv = r;
    if (Math.abs(a[piv][col]) < 1e-12) return null;
    [a[col], a[piv]] = [a[piv], a[col]];
    const d = a[col][col];
    for (let j = 0; j < 2 * n; j++) a[col][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = a[r][col];
      for (let j = 0; j < 2 * n; j++) a[r][j] -= f * a[col][j];
    }
  }
  return a.map((row) => row.slice(n));
}


export function fitUtilityModel(
  refs: Reference[],
  comparisons: Comparison[],
  opts?: { lambda?: number; lr?: number; iters?: number },
): UtilityModel {
  const lambda = opts?.lambda ?? 0.05; // L2 regularization (guards few-sample overfit)
  const lr = opts?.lr ?? 0.6;
  const iters = opts?.iters ?? 400;
  const A = AXIS_IDS.length;
  const byId = new Map(refs.map((r) => [r.id, r]));

  const feats: number[][] = [];
  for (const c of comparisons) {
    const w = byId.get(c.winner);
    const l = byId.get(c.loser);
    if (!w || !l) continue;
    feats.push(AXIS_IDS.map((a) => (w.axes[a] - l.axes[a]) / 100));
  }

  const wv = new Array(A).fill(0);
  let loss = 0;
  const n = Math.max(1, feats.length);

  for (let it = 0; it < iters; it++) {
    const grad = new Array(A).fill(0);
    loss = 0;
    for (const f of feats) {
      let z = 0;
      for (let k = 0; k < A; k++) z += wv[k] * f[k];
      const p = sigmoid(z);
      loss += -Math.log(Math.max(p, 1e-9));
      const d = p - 1; // ∂(−log p)/∂z for the "winner wins" label
      for (let k = 0; k < A; k++) grad[k] += d * f[k];
    }
    for (let k = 0; k < A; k++) {
      grad[k] = grad[k] / n + lambda * wv[k];
      wv[k] -= lr * grad[k];
    }
  }

  const weights = {} as Record<AxisId, number>;
  const importance = {} as Record<AxisId, number>;
  AXIS_IDS.forEach((a, i) => (weights[a] = Math.round(wv[i] * 1000) / 1000));
  const maxAbs = Math.max(1e-6, ...wv.map((x) => Math.abs(x)));
  AXIS_IDS.forEach((a, i) => (importance[a] = Math.round((Math.abs(wv[i]) / maxAbs) * 1000) / 1000));

  const utility = (axes: AxisVector) =>
    AXIS_IDS.reduce((s, a) => s + weights[a] * (axes[a] / 100), 0);
  const prob = (a: AxisVector, b: AxisVector) => sigmoid(utility(a) - utility(b));

  // Information matrix H = Σ p(1−p) ffᵀ + λI; Cov = H⁻¹. The mean weight
  // standard error tells us how settled the part-worths are — v3 stops once
  // it's low enough rather than after a fixed number of shows.
  const H: number[][] = Array.from({ length: A }, () => new Array(A).fill(0));
  for (const f of feats) {
    let z = 0;
    for (let k = 0; k < A; k++) z += wv[k] * f[k];
    const p = sigmoid(z);
    const w = p * (1 - p);
    for (let i = 0; i < A; i++) for (let j = 0; j < A; j++) H[i][j] += w * f[i] * f[j];
  }
  for (let i = 0; i < A; i++) H[i][i] += lambda;
  const cov = invert(H);
  const se0 = 1 / Math.sqrt(lambda); // no-data baseline
  let se = se0;
  if (cov) {
    // Effect-size-weighted SE: axes with bigger part-worths matter more, so an
    // indifferent-but-decisive user converges quickly instead of being held
    // hostage to the variance of axes they don't care about.
    let num = 0;
    let den = 0;
    for (let i = 0; i < A; i++) {
      const wi = Math.abs(wv[i]) + 0.05;
      num += wi * Math.max(0, cov[i][i]);
      den += wi;
    }
    se = Math.sqrt(num / den);
  }
  const seTarget = 1.15; // calibrated so a typical taste reaches ~0.85 by ~14 screens
  const confidence = Math.min(1, Math.max(0, (se0 - se) / (se0 - seTarget)));

  return {
    weights,
    importance,
    utility,
    prob,
    trained: feats.length >= 8,
    loss: loss / n,
    se: Math.round(se * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
  };
}
