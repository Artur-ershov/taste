import type { AxisDef, AxisId } from "../types";

/**
 * The axis vocabulary. A deliberately small, near-orthogonal set distilled
 * from the common design-taxonomy axes (density, whitespace, minimal/maximal,
 * typographic contrast, geometric/organic, saturation, temperature, corner
 * treatment, depth, brutalism). Overlapping pairs (density+whitespace,
 * minimal+ornamentation) are merged so the axes stay independent.
 */
export const AXES: AxisDef[] = [
  {
    id: "tone",
    label: "Tone",
    lowPole: "Light",
    highPole: "Dark",
    description: "Overall lightness of the canvas — light theme vs dark theme.",
    briefLow: "a light, bright canvas",
    briefHigh: "a dark, low-light canvas",
  },
  {
    id: "density",
    label: "Density",
    lowPole: "Airy",
    highPole: "Packed",
    description: "Information/whitespace density — generous breathing room vs tightly packed.",
    briefLow: "generous whitespace and airy spacing",
    briefHigh: "dense, tightly packed layouts",
  },
  {
    id: "complexity",
    label: "Complexity",
    lowPole: "Minimal",
    highPole: "Maximal",
    description: "Minimalism vs maximalism — restraint and few elements vs ornament and abundance.",
    briefLow: "minimal, restrained composition",
    briefHigh: "maximal, layered, ornament-rich composition",
  },
  {
    id: "saturation",
    label: "Saturation",
    lowPole: "Muted",
    highPole: "Vivid",
    description: "Color saturation — desaturated/muted vs vivid/punchy.",
    briefLow: "a muted, desaturated palette",
    briefHigh: "a vivid, saturated palette",
  },
  {
    id: "temperature",
    label: "Temperature",
    lowPole: "Cool",
    highPole: "Warm",
    description: "Color temperature — cool blues/cyans vs warm oranges/reds.",
    briefLow: "cool color temperature",
    briefHigh: "warm color temperature",
  },
  {
    id: "cornerSoftness",
    label: "Corners",
    lowPole: "Sharp",
    highPole: "Rounded",
    description: "Corner treatment — sharp right angles vs soft, rounded radii.",
    briefLow: "sharp, square corners",
    briefHigh: "soft, rounded corners",
  },
  {
    id: "depth",
    label: "Depth",
    lowPole: "Flat",
    highPole: "Layered",
    description: "Depth cues — flat design vs shadows, elevation and layering.",
    briefLow: "flat surfaces with little elevation",
    briefHigh: "layered surfaces with shadows and elevation",
  },
  {
    id: "typeContrast",
    label: "Type contrast",
    lowPole: "Uniform",
    highPole: "Dramatic",
    description: "Typographic scale contrast — even sizing vs dramatic display-to-body jumps.",
    briefLow: "low typographic contrast",
    briefHigh: "high typographic contrast with large display type",
  },
  {
    id: "typePersonality",
    label: "Type voice",
    lowPole: "Neutral",
    highPole: "Expressive",
    description: "Type personality — neutral grotesque vs expressive serif/display voices.",
    briefLow: "neutral, grotesque sans-serif type",
    briefHigh: "expressive, characterful display/serif type",
  },
  {
    id: "geometry",
    label: "Geometry",
    lowPole: "Geometric",
    highPole: "Organic",
    description: "Shape language — strict geometric forms vs organic, hand-drawn shapes.",
    briefLow: "geometric, hard-edged shapes",
    briefHigh: "organic, soft, hand-drawn shapes",
  },
  {
    id: "gridStrictness",
    label: "Layout",
    lowPole: "Structured",
    highPole: "Broken",
    description: "Layout discipline — strict aligned grid vs broken, asymmetric composition.",
    briefLow: "a strict, aligned grid",
    briefHigh: "a broken, asymmetric layout",
  },
  {
    id: "brutalism",
    label: "Finish",
    lowPole: "Refined",
    highPole: "Raw",
    description: "Finish — polished and refined vs raw, brutalist, utilitarian.",
    briefLow: "a polished, refined finish",
    briefHigh: "a raw, brutalist finish",
  },
];

export const AXIS_IDS: AxisId[] = AXES.map((a) => a.id);

export const AXIS_BY_ID: Record<AxisId, AxisDef> = Object.fromEntries(
  AXES.map((a) => [a.id, a]),
) as Record<AxisId, AxisDef>;
