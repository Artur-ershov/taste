// Core domain types for the aesthetic-profiling picker.

/**
 * The near-orthogonal design axes a reference is tagged on, and that the
 * exported profile reports. Every axis is bipolar and scored on -100..+100,
 * where 0 is neutral. The pole labels live in `lib/axes.ts`.
 *
 * Keeping the set small and orthogonal is the whole game: organic stimuli
 * vary on many axes at once (the "confounding problem"), so each reference's
 * rendering here is derived *from* its axis vector — the tags are ground truth.
 */
export type AxisId =
  | "tone"
  | "density"
  | "complexity"
  | "saturation"
  | "temperature"
  | "paletteRichness"
  | "gradients"
  | "cornerSoftness"
  | "depth"
  | "typeContrast"
  | "typePersonality"
  | "fontWeight"
  | "letterCase"
  | "geometry"
  | "gridStrictness"
  | "brutalism";

export type AxisVector = Record<AxisId, number>;

export interface AxisDef {
  id: AxisId;
  /** Short display name, e.g. "Density". */
  label: string;
  /** Label at the -100 pole, e.g. "Airy". */
  lowPole: string;
  /** Label at the +100 pole, e.g. "Packed". */
  highPole: string;
  /** One-line explanation for the profile / tooltips. */
  description: string;
  /** Token-side hint used when phrasing the natural-language brief. */
  briefLow: string;
  briefHigh: string;
}

/** A pre-tagged design reference. Its look is rendered from `axes`. */
export interface Reference {
  id: string;
  name: string;
  /** Style-family label used in the brief, e.g. "Neo-brutalist". */
  family: string;
  axes: AxisVector;
}

/** A single recorded 2AFC decision. */
export interface Comparison {
  winner: string; // reference id
  loser: string; // reference id
  ts: number;
}

/** Per-reference strength estimates accumulated over a session. */
export interface Strength {
  id: string;
  /** Live Elo rating (order-dependent, used for the progress UI). */
  elo: number;
  /** Bradley-Terry standardized log-strength (batch fit, cleaner ranking). */
  bt: number;
  comparisons: number;
  wins: number;
}

/** A resolved position on one axis, with a confidence estimate. */
export interface AxisScore {
  id: AxisId;
  value: number; // -100..100
  confidence: number; // 0..1
}

/** Per-axis part-worth from the conjoint logit model (v2). */
export interface AxisDriver {
  id: AxisId;
  /** signed utility weight (preferred direction + strength) */
  weight: number;
  /** |weight| normalized to 0..1 across axes (relative importance) */
  importance: number;
}

/** The full three-layer aesthetic profile artifact. */
export interface Profile {
  meta: {
    project: string;
    createdAt: string;
    comparisons: number;
    referenceCount: number;
    generator: string;
  };
  axes: AxisScore[];
  /** Axes ranked by how much they drove the choices (conjoint part-worths). */
  drivers: AxisDriver[];
  /** Fraction of picks that agreed with the final ranking (0.5 = noise, 1 = perfectly transitive). */
  consistency: number;
  /** Held-out cross-validation of the model (null if too few judgments). */
  validation: import("./lib/validate").Validation | null;
  /** Top-ranked references to emulate (ids). */
  emulate: string[];
  /** Bottom-ranked + explicitly rejected references to avoid (ids). */
  avoid: string[];
  ranking: Strength[];
}
