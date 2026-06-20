import type { AxisScore, AxisVector } from "../types";
import { lerp, swatch, unit, type Swatch } from "./color";
import { AXIS_IDS } from "./axes";

/** A resolved palette derived purely from the axis vector (tags = ground truth). */
export interface Palette {
  bg: Swatch;
  surface: Swatch;
  surfaceAlt: Swatch;
  text: Swatch;
  textMuted: Swatch;
  border: Swatch;
  primary: Swatch;
  primaryFg: Swatch;
  accent: Swatch; // = accents[0]
  accents: Swatch[]; // 1–3 hues depending on paletteRichness
  isDark: boolean;
  hue: number;
}

/** Everything a StimulusCard / token export needs, derived from the axes. */
export interface RenderStyle {
  palette: Palette;
  radius: number; // px, base control radius
  cardRadius: number; // px, outer container
  shadow: string;
  shadowSm: string;
  borderWidth: number; // px
  pad: number; // px, base padding unit
  gap: number; // px, base gap
  headingFont: string;
  bodyFont: string;
  monoAccent: boolean;
  typeScale: number; // heading/body ratio
  bodySize: number; // px
  headingSize: number; // px
  weightHeading: number;
  weightBody: number;
  letterSpacing: number; // em, headings
  blobness: number; // 0..1 organic shapes
  asymmetry: number; // 0..1 broken layout
  richness: number; // 0..1 maximalism (extra elements)
  gradientStrength: number; // 0..1 flat→gradient fills
  uppercaseNav: boolean;
  uppercaseHead: boolean;
}

/** Convert resolved AxisScore[] back into a plain vector for rendering. */
export function vectorFromScores(scores: AxisScore[]): AxisVector {
  const v = {} as AxisVector;
  for (const id of AXIS_IDS) v[id] = 0;
  for (const s of scores) v[s.id] = s.value;
  return v;
}

function vecHash(a: AxisVector): number {
  let h = 0;
  for (const k of AXIS_IDS) h = (h * 31 + (a[k] | 0)) | 0;
  return Math.abs(h);
}

export function buildPalette(a: AxisVector): Palette {
  const toneN = unit(a.tone); // 0 light .. 1 dark
  const isDark = toneN > 0.5;
  const satN = unit(a.saturation);
  const tempN = unit(a.temperature);
  const richN = unit(a.paletteRichness); // 0 mono .. 1 multicolor

  const warm = tempN - 0.5;
  const hue =
    warm > 0.08
      ? lerp(55, 28, Math.min(1, (warm - 0.08) / 0.42))
      : lerp(215, 255, Math.min(1, (0.08 - warm) / 0.58));
  const accentC = lerp(0.045, 0.205, satN);
  const tintC = lerp(0.003, 0.028, satN);

  const bgL = isDark ? lerp(0.22, 0.14, (toneN - 0.5) * 2) : lerp(0.99, 0.95, toneN * 2);
  const surfaceL = isDark ? bgL + 0.05 : Math.min(0.999, bgL + 0.012);
  const surfaceAltL = isDark ? bgL + 0.09 : bgL - 0.025;
  const borderL = isDark ? bgL + 0.16 : bgL - 0.1;
  const textL = isDark ? 0.96 : 0.21;
  const mutedL = isDark ? 0.72 : 0.46;

  const primaryL = isDark ? 0.74 : 0.56;
  const primary = swatch(primaryL, accentC, hue);
  const primaryFg = swatch(primaryL > 0.62 ? 0.18 : 0.99, primaryL > 0.62 ? tintC : 0.0, hue);

  // 1–3 accent hues: monochrome keeps them near the primary; multicolor spreads them.
  const accentL = isDark ? 0.7 : 0.62;
  const baseAccentHue = (hue + 150) % 360;
  const nAcc = richN < 0.3 ? 1 : richN < 0.62 ? 2 : 3;
  const accents: Swatch[] = [];
  for (let i = 0; i < nAcc; i++) {
    const h = (baseAccentHue + i * lerp(25, 120, richN) + 360) % 360;
    const c = i === 0 ? accentC * 0.95 : lerp(accentC * 0.4, accentC, richN);
    accents.push(swatch(accentL, c, h));
  }

  return {
    bg: swatch(bgL, tintC, hue),
    surface: swatch(surfaceL, tintC * 0.8, hue),
    surfaceAlt: swatch(surfaceAltL, tintC, hue),
    text: swatch(textL, tintC * 0.5, hue),
    textMuted: swatch(mutedL, tintC * 0.6, hue),
    border: swatch(borderL, tintC * 0.7, hue),
    primary,
    primaryFg,
    accent: accents[0],
    accents,
    isDark,
    hue,
  };
}

// Curated web-font families (loaded in index.html), with fallback stacks.
const SANS_NEUTRAL = [
  '"Inter", system-ui, sans-serif',
  '"Archivo", system-ui, sans-serif',
  '"Space Grotesk", system-ui, sans-serif',
  '"Sora", system-ui, sans-serif',
];
const SANS_HUMANIST = [
  '"DM Sans", system-ui, sans-serif',
  '"Figtree", system-ui, sans-serif',
  '"Mulish", system-ui, sans-serif',
];
const DISPLAY = [
  '"Fraunces", Georgia, serif',
  '"Playfair Display", Georgia, serif',
  '"DM Serif Display", Georgia, serif',
  '"Spectral", Georgia, serif',
];
const MONO = ['"JetBrains Mono", ui-monospace, monospace', '"Space Mono", ui-monospace, monospace'];

const snap = (w: number) => Math.max(300, Math.min(900, Math.round(w / 100) * 100));

export function deriveStyle(a: AxisVector): RenderStyle {
  const palette = buildPalette(a);
  const h = vecHash(a);

  const softN = unit(a.cornerSoftness);
  const depthN = unit(a.depth);
  const densityN = unit(a.density);
  const rawN = unit(a.brutalism);
  const contrastN = unit(a.typeContrast);
  const personalityN = unit(a.typePersonality);
  const heavyN = unit(a.fontWeight);
  const caseN = unit(a.letterCase);
  const organicN = unit(a.geometry);
  const brokenN = unit(a.gridStrictness);
  const maximalN = unit(a.complexity);

  const radius = Math.round(lerp(0, 22, softN) * (1 - rawN * 0.6));
  const borderWidth = Math.round(lerp(1, 3.2, rawN));

  const shadowColor = palette.isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.16)";
  const e = depthN * (palette.isDark ? 1.1 : 1);
  const shadow = depthN < 0.08 ? "none" : `0 ${Math.round(2 + e * 18)}px ${Math.round(8 + e * 40)}px ${shadowColor}`;
  const shadowSm = depthN < 0.08 ? "none" : `0 ${Math.round(1 + e * 4)}px ${Math.round(2 + e * 10)}px ${shadowColor}`;

  // Font family: tier from type voice (+ mono when raw), specific face varied
  // deterministically by the vector so the set isn't all one font.
  const monoAccent = rawN > 0.62;
  const pick = (pool: string[]) => pool[h % pool.length];
  let headingFont: string;
  let bodyFont: string;
  if (monoAccent) {
    headingFont = pick(MONO);
    bodyFont = pick(MONO);
  } else if (personalityN > 0.62) {
    headingFont = pick(DISPLAY);
    bodyFont = pick(SANS_NEUTRAL);
  } else if (personalityN > 0.38) {
    headingFont = pick(SANS_HUMANIST);
    bodyFont = headingFont;
  } else {
    headingFont = pick(SANS_NEUTRAL);
    bodyFont = headingFont;
  }

  const bodySize = Math.round(lerp(15, 12.5, densityN));
  const typeScale = lerp(1.15, 2.7, contrastN);
  const headingSize = Math.round(bodySize * typeScale);

  let weightHeading = snap(lerp(520, 850, heavyN) + (contrastN > 0.55 ? 70 : 0));
  if (personalityN > 0.62) weightHeading = Math.min(weightHeading, 700); // display faces
  const weightBody = snap(lerp(300, 500, heavyN));

  return {
    palette,
    radius,
    cardRadius: Math.round(radius * 0.8 + 6),
    shadow,
    shadowSm,
    borderWidth,
    pad: Math.round(lerp(26, 11, densityN)),
    gap: Math.round(lerp(18, 7, densityN)),
    headingFont,
    bodyFont,
    monoAccent,
    typeScale,
    bodySize,
    headingSize,
    weightHeading,
    weightBody,
    letterSpacing: lerp(0.01, -0.03, contrastN),
    blobness: organicN,
    asymmetry: brokenN,
    richness: maximalN,
    gradientStrength: unit(a.gradients),
    uppercaseNav: caseN > 0.42 || rawN > 0.6,
    uppercaseHead: caseN > 0.74,
  };
}
