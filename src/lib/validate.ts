import type { Comparison, Reference } from "../types";
import { fitUtilityModel } from "./utility";

export interface Validation {
  /** Held-out accuracy: % of unseen choices the model predicts correctly. */
  heldOut: number;
  /** In-sample accuracy (for an overfit gauge). */
  train: number;
  /** Number of held-out choices evaluated. */
  n: number;
  screens: number;
}

/**
 * k-fold cross-validation of the conjoint model — the honest, falsifiable
 * answer to "is this profile real?". We hold out whole *screens* (comparisons
 * within a best–worst screen are correlated, so leaking one into training
 * would inflate the score), fit on the rest, and predict the held-out choices.
 *
 * ~0.5 = no better than chance (the picks carry no learnable taste);
 * ~0.75–0.85 = the taste genuinely generalizes (cf. CMU's 79.4%).
 */
export function heldOutAccuracy(
  refs: Reference[],
  comparisons: Comparison[],
  k = 5,
): Validation | null {
  const byId = new Map(refs.map((r) => [r.id, r]));

  // Group comparisons into screens by timestamp.
  const byTs = new Map<number, Comparison[]>();
  for (const c of comparisons) {
    const arr = byTs.get(c.ts);
    if (arr) arr.push(c);
    else byTs.set(c.ts, [c]);
  }
  const screens = [...byTs.values()];
  if (screens.length < 3 || comparisons.length < 12) return null;

  const folds = Math.min(k, screens.length);
  const predict = (m: ReturnType<typeof fitUtilityModel>, c: Comparison) => {
    const w = byId.get(c.winner);
    const l = byId.get(c.loser);
    return w && l ? m.prob(w.axes, l.axes) > 0.5 : null;
  };

  let correct = 0;
  let total = 0;
  for (let f = 0; f < folds; f++) {
    const train: Comparison[] = [];
    const test: Comparison[] = [];
    screens.forEach((sc, i) => (i % folds === f ? test : train).push(...sc));
    if (!test.length || train.length < 6) continue;
    const m = fitUtilityModel(refs, train);
    for (const c of test) {
      const ok = predict(m, c);
      if (ok === null) continue;
      total++;
      if (ok) correct++;
    }
  }

  const full = fitUtilityModel(refs, comparisons);
  let tc = 0;
  let tt = 0;
  for (const c of comparisons) {
    const ok = predict(full, c);
    if (ok === null) continue;
    tt++;
    if (ok) tc++;
  }

  return {
    heldOut: total ? Math.round((correct / total) * 100) / 100 : 0,
    train: tt ? Math.round((tc / tt) * 100) / 100 : 0,
    n: total,
    screens: screens.length,
  };
}
