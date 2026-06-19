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
  accent: Swatch;
  isDark: boolean;
  hue: number;
}

/** Everything a StimulusCard / token export needs, derived from the axes. */
export interface RenderStyle {
  palette: Palette;
  radius: number; // px, base control radius
  cardRadius: number; // px, outer container
  shadow: string; // css box-shadow for elevated surfaces
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
  letterSpacing: number; // em, headings
  blobness: number; // 0..1 organic shapes
  asymmetry: number; // 0..1 broken layout
  richness: number; // 0..1 maximalism (extra elements)
  uppercaseNav: boolean;
}

/** Convert resolved AxisScore[] back into a plain vector for rendering. */
export function vectorFromScores(scores: AxisScore[]): AxisVector {
  const v = {} as AxisVector;
  for (const id of AXIS_IDS) v[id] = 0;
  for (const s of scores) v[s.id] = s.value;
  return v;
}

export function buildPalette(a: AxisVector): Palette {
  const toneN = unit(a.tone); // 0 light .. 1 dark
  const isDark = toneN > 0.5;
  const satN = unit(a.saturation); // 0 muted .. 1 vivid
  const tempN = unit(a.temperature); // 0 cool .. 1 warm

  // Warm↔cool as hue families, avoiding the green band at the midpoint: a clear
  // warm lean maps to amber→red, everything neutral-or-cool stays in the blue
  // family (the least-surprising "neutral brand" hue). `warm` is -0.5..+0.5.
  const warm = tempN - 0.5;
  const hue =
    warm > 0.08
      ? lerp(55, 28, Math.min(1, (warm - 0.08) / 0.42)) // amber -> red-orange
      : lerp(215, 255, Math.min(1, (0.08 - warm) / 0.58)); // azure -> deep blue
  const accentC = lerp(0.045, 0.205, satN);
  const tintC = lerp(0.003, 0.028, satN); // neutrals pick up a faint tint when vivid

  const bgL = isDark ? lerp(0.22, 0.14, (toneN - 0.5) * 2) : lerp(0.99, 0.95, toneN * 2);
  const surfaceL = isDark ? bgL + 0.05 : Math.min(0.999, bgL + 0.012);
  const surfaceAltL = isDark ? bgL + 0.09 : bgL - 0.025;
  const borderL = isDark ? bgL + 0.16 : bgL - 0.1;
  const textL = isDark ? 0.96 : 0.21;
  const mutedL = isDark ? 0.72 : 0.46;

  // Primary that reads on the background; foreground that reads on the primary.
  const primaryL = isDark ? 0.74 : 0.56;
  const primary = swatch(primaryL, accentC, hue);
  const primaryFg = swatch(primaryL > 0.62 ? 0.18 : 0.99, primaryL > 0.62 ? tintC : 0.0, hue);
  const accent = swatch(isDark ? 0.7 : 0.62, accentC * 0.95, (hue + 150) % 360);

  return {
    bg: swatch(bgL, tintC, hue),
    surface: swatch(surfaceL, tintC * 0.8, hue),
    surfaceAlt: swatch(surfaceAltL, tintC, hue),
    text: swatch(textL, tintC * 0.5, hue),
    textMuted: swatch(mutedL, tintC * 0.6, hue),
    border: swatch(borderL, tintC * 0.7, hue),
    primary,
    primaryFg,
    accent,
    isDark,
    hue,
  };
}

const GROTESQUE = '"Inter", "Helvetica Neue", system-ui, sans-serif';
const HUMANIST = '"Verdana", "Segoe UI", system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", "Playfair Display", serif';
const MONO = '"SFMono-Regular", "JetBrains Mono", ui-monospace, monospace';

export function deriveStyle(a: AxisVector): RenderStyle {
  const palette = buildPalette(a);

  const softN = unit(a.cornerSoftness);
  const depthN = unit(a.depth);
  const densityN = unit(a.density); // 0 airy .. 1 packed
  const rawN = unit(a.brutalism); // 0 refined .. 1 raw
  const contrastN = unit(a.typeContrast);
  const personalityN = unit(a.typePersonality); // 0 neutral .. 1 expressive
  const organicN = unit(a.geometry); // 0 geometric .. 1 organic
  const brokenN = unit(a.gridStrictness); // 0 structured .. 1 broken
  const maximalN = unit(a.complexity); // 0 minimal .. 1 maximal

  const radius = Math.round(lerp(0, 22, softN) * (1 - rawN * 0.6));
  const borderWidth = Math.round(lerp(1, 3.2, rawN));

  const shadowColor = palette.isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.16)";
  const e = depthN * (palette.isDark ? 1.1 : 1);
  const shadow =
    depthN < 0.08
      ? "none"
      : `0 ${Math.round(2 + e * 18)}px ${Math.round(8 + e * 40)}px ${shadowColor}`;
  const shadowSm = depthN < 0.08 ? "none" : `0 ${Math.round(1 + e * 4)}px ${Math.round(2 + e * 10)}px ${shadowColor}`;

  // Expressive -> serif display; neutral -> grotesque; mid -> humanist sans.
  let headingFont = GROTESQUE;
  if (personalityN > 0.62) headingFont = SERIF;
  else if (personalityN > 0.38) headingFont = HUMANIST;
  const monoAccent = rawN > 0.62;
  const bodyFont = monoAccent ? MONO : personalityN > 0.62 ? GROTESQUE : headingFont;

  const bodySize = Math.round(lerp(15, 12.5, densityN));
  const typeScale = lerp(1.15, 2.7, contrastN);
  const headingSize = Math.round(bodySize * typeScale);

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
    weightHeading: personalityN > 0.62 ? 600 : contrastN > 0.55 ? 800 : 700,
    letterSpacing: lerp(0.01, -0.03, contrastN),
    blobness: organicN,
    asymmetry: brokenN,
    richness: maximalN,
    uppercaseNav: rawN > 0.5 || (contrastN > 0.6 && personalityN < 0.4),
  };
}
