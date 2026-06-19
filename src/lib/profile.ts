import type {
  AxisDriver,
  AxisId,
  AxisScore,
  Comparison,
  Profile,
  Reference,
  Strength,
} from "../types";
import { AXIS_IDS } from "./axes";
import { fitBradleyTerry } from "./bradleyTerry";
import { fitUtilityModel } from "./utility";
import { suggestedRounds } from "./pairing";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const round = (x: number) => Math.round(x);

/**
 * Synthesize the aesthetic profile from the session.
 *
 * Per the build guide's Stage-1 recommendation we derive axis scores by a
 * strength-weighted average of the references' tags — but we weight by a
 * softmax of the Bradley-Terry strength (not a hard top-k cut), so the
 * references the client preferred dominate smoothly. Confidence combines how
 * much data we have with how much the preferred references *agree* on each axis.
 */
export function buildProfile(
  refs: Reference[],
  comparisons: Comparison[],
  live: Map<string, Strength>,
  explicitAvoid: string[],
  project: string,
): Profile {
  const ids = refs.map((r) => r.id);
  const byId = new Map(refs.map((r) => [r.id, r]));
  const bt = fitBradleyTerry(ids, comparisons);

  const ranking: Strength[] = refs
    .map((r) => {
      const l = live.get(r.id);
      return {
        id: r.id,
        elo: round(l?.elo ?? 1500),
        bt: Math.round((bt.get(r.id)?.z ?? 0) * 1000) / 1000,
        comparisons: l?.comparisons ?? 0,
        wins: l?.wins ?? 0,
      };
    })
    .sort((a, b) => b.bt - a.bt);

  // Softmax weights over BT strength — preferred references dominate smoothly.
  const beta = 1.1;
  const zById = new Map(ids.map((id) => [id, bt.get(id)?.z ?? 0]));
  const maxZ = Math.max(...ids.map((id) => zById.get(id)!));
  let wSum = 0;
  const w = new Map<string, number>();
  for (const id of ids) {
    const e = Math.exp(beta * (zById.get(id)! - maxZ));
    w.set(id, e);
    wSum += e;
  }
  for (const id of ids) w.set(id, w.get(id)! / wSum);

  const dataConf = clamp01(comparisons.length / suggestedRounds(refs.length));

  const axes: AxisScore[] = AXIS_IDS.map((axis: AxisId) => {
    let mean = 0;
    for (const r of refs) mean += w.get(r.id)! * r.axes[axis];
    let variance = 0;
    for (const r of refs) variance += w.get(r.id)! * (r.axes[axis] - mean) ** 2;
    const sd = Math.sqrt(variance);
    const agreement = clamp01(1 - sd / 70);
    const confidence = clamp01((0.35 + 0.65 * dataConf) * agreement);
    return {
      id: axis,
      value: round(mean),
      confidence: Math.round(confidence * 100) / 100,
    };
  });

  // Conjoint logit: per-axis part-worths (v2).
  const model = fitUtilityModel(refs, comparisons);
  const drivers: AxisDriver[] = AXIS_IDS.map((a) => ({
    id: a,
    weight: model.weights[a],
    importance: model.importance[a],
  })).sort((x, y) => y.importance - x.importance);

  // Consistency: how often a pick agreed with the final ranking.
  let agree = 0;
  for (const c of comparisons) {
    if ((zById.get(c.winner) ?? 0) >= (zById.get(c.loser) ?? 0)) agree++;
  }
  const consistency = comparisons.length
    ? Math.round((agree / comparisons.length) * 100) / 100
    : 0.5;

  const emulate = ranking.slice(0, 4).map((s) => s.id);

  const avoidSet = new Set<string>();
  for (const id of explicitAvoid) if (byId.has(id)) avoidSet.add(id);
  for (let i = ranking.length - 1; i >= 0 && avoidSet.size < 4; i--) {
    const s = ranking[i];
    if (s.bt < 0 && !emulate.includes(s.id)) avoidSet.add(s.id);
  }

  return {
    meta: {
      project: project.trim() || "Untitled profile",
      createdAt: new Date().toISOString(),
      comparisons: comparisons.length,
      referenceCount: refs.length,
      generator: "Taste · aesthetic-profiling picker",
    },
    axes,
    drivers,
    consistency,
    emulate,
    avoid: [...avoidSet],
    ranking,
  };
}
