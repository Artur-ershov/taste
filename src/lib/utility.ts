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
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));

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

  return { weights, importance, utility, prob, trained: feats.length >= 8, loss: loss / n };
}
