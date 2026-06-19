import type { AxisVector, Reference } from "../types";

// The stimulus set. Each reference is a coherent point in axis-space; its visual
// is rendered *from* this vector (see lib/render.ts), so the tags are ground
// truth and never drift from what the user actually sees.
//
// We start from hand-authored archetypes and derive controlled variants that
// perturb only 1–2 axes. This spans the space (light/dark, muted/vivid,
// minimal/maximal, refined/raw, geometric/organic …) while keeping every
// reference internally coherent — random 12-D vectors would render as noise.

const clamp = (v: number) => Math.max(-100, Math.min(100, v));

interface Archetype {
  base: string; // id stem
  name: string;
  family: string;
  v: AxisVector;
  variants?: { suffix: string; name: string; over: Partial<AxisVector> }[];
}

const A: Archetype[] = [
  {
    base: "soft-minimal",
    name: "Soft Minimal",
    family: "Soft minimalist",
    v: {
      tone: -60, density: -55, complexity: -65, saturation: -40, temperature: -15,
      cornerSoftness: 55, depth: 15, typeContrast: -10, typePersonality: -30,
      geometry: 20, gridStrictness: -40, brutalism: -70,
    },
    variants: [
      { suffix: "dark", name: "Soft Minimal · Dark", over: { tone: 55, depth: 35 } },
      { suffix: "warm", name: "Soft Minimal · Warm", over: { temperature: 50 } },
    ],
  },
  {
    base: "editorial-serif",
    name: "Editorial Serif",
    family: "Editorial",
    v: {
      tone: -50, density: -10, complexity: -10, saturation: -35, temperature: 25,
      cornerSoftness: -40, depth: -20, typeContrast: 70, typePersonality: 80,
      geometry: -30, gridStrictness: -20, brutalism: -50,
    },
    variants: [
      { suffix: "bold", name: "Editorial Serif · Bold", over: { typeContrast: 95, complexity: 25 } },
      { suffix: "dark", name: "Editorial Serif · Dark", over: { tone: 60, temperature: 10 } },
    ],
  },
  {
    base: "neo-brutalist",
    name: "Neo-Brutalist",
    family: "Neo-brutalist",
    v: {
      tone: -30, density: 30, complexity: 35, saturation: 70, temperature: 35,
      cornerSoftness: -80, depth: 10, typeContrast: 60, typePersonality: -10,
      geometry: -60, gridStrictness: 55, brutalism: 85,
    },
    variants: [
      { suffix: "mono", name: "Neo-Brutalist · Mono", over: { saturation: -55, temperature: -10 } },
      { suffix: "cyan", name: "Neo-Brutalist · Cyan", over: { temperature: -55, saturation: 80 } },
    ],
  },
  {
    base: "vivid-maximal",
    name: "Vivid Maximal",
    family: "Maximalist",
    v: {
      tone: -10, density: 55, complexity: 85, saturation: 85, temperature: 45,
      cornerSoftness: 40, depth: 55, typeContrast: 65, typePersonality: 55,
      geometry: 50, gridStrictness: 45, brutalism: 0,
    },
    variants: [
      { suffix: "cool", name: "Vivid Maximal · Cool", over: { temperature: -45 } },
      { suffix: "dark", name: "Vivid Maximal · Dark", over: { tone: 60 } },
    ],
  },
  {
    base: "corporate-clean",
    name: "Corporate Clean",
    family: "Corporate clean",
    v: {
      tone: -45, density: 0, complexity: -20, saturation: 0, temperature: -45,
      cornerSoftness: 25, depth: 35, typeContrast: 20, typePersonality: -45,
      geometry: -20, gridStrictness: -60, brutalism: -55,
    },
    variants: [
      { suffix: "warm", name: "Corporate Clean · Warm", over: { temperature: 35 } },
      { suffix: "flat", name: "Corporate Clean · Flat", over: { depth: -45, cornerSoftness: -25 } },
    ],
  },
  {
    base: "dark-techno",
    name: "Dark Techno",
    family: "Dark technical",
    v: {
      tone: 70, density: 25, complexity: 20, saturation: 65, temperature: -55,
      cornerSoftness: -10, depth: 50, typeContrast: 45, typePersonality: -25,
      geometry: -45, gridStrictness: -20, brutalism: 30,
    },
    variants: [
      { suffix: "magenta", name: "Dark Techno · Magenta", over: { temperature: 40, saturation: 80 } },
      { suffix: "light", name: "Dark Techno · Light", over: { tone: -55, depth: 30 } },
    ],
  },
  {
    base: "pastel-playful",
    name: "Pastel Playful",
    family: "Playful pastel",
    v: {
      tone: -55, density: -20, complexity: 25, saturation: -10, temperature: 30,
      cornerSoftness: 80, depth: 30, typeContrast: 25, typePersonality: 35,
      geometry: 65, gridStrictness: 10, brutalism: -45,
    },
    variants: [
      { suffix: "cool", name: "Pastel Playful · Cool", over: { temperature: -45 } },
      { suffix: "vivid", name: "Pastel Playful · Vivid", over: { saturation: 55 } },
    ],
  },
  {
    base: "warm-organic",
    name: "Warm Organic",
    family: "Warm organic",
    v: {
      tone: -35, density: -40, complexity: -15, saturation: -25, temperature: 65,
      cornerSoftness: 60, depth: 10, typeContrast: 30, typePersonality: 50,
      geometry: 75, gridStrictness: 25, brutalism: -40,
    },
    variants: [
      { suffix: "muted", name: "Warm Organic · Muted", over: { saturation: -60 } },
      { suffix: "dark", name: "Warm Organic · Dark", over: { tone: 50 } },
    ],
  },
  {
    base: "swiss-mono",
    name: "Swiss Mono",
    family: "Swiss / International",
    v: {
      tone: -55, density: 10, complexity: -55, saturation: -50, temperature: -10,
      cornerSoftness: -60, depth: -30, typeContrast: 65, typePersonality: -55,
      geometry: -70, gridStrictness: -75, brutalism: -20,
    },
    variants: [
      { suffix: "red", name: "Swiss Mono · Red accent", over: { saturation: 35, temperature: 40 } },
      { suffix: "airy", name: "Swiss Mono · Airy", over: { density: -55 } },
    ],
  },
  {
    base: "glass-gradient",
    name: "Glass Gradient",
    family: "Glassmorphic",
    v: {
      tone: 40, density: 0, complexity: 40, saturation: 60, temperature: -35,
      cornerSoftness: 70, depth: 80, typeContrast: 40, typePersonality: -15,
      geometry: 40, gridStrictness: -10, brutalism: -50,
    },
    variants: [
      { suffix: "warm", name: "Glass Gradient · Warm", over: { temperature: 50 } },
      { suffix: "light", name: "Glass Gradient · Light", over: { tone: -45 } },
    ],
  },
  {
    base: "bauhaus-primary",
    name: "Bauhaus Primary",
    family: "Geometric primary",
    v: {
      tone: -45, density: 15, complexity: 30, saturation: 80, temperature: 0,
      cornerSoftness: -30, depth: 0, typeContrast: 55, typePersonality: -20,
      geometry: -80, gridStrictness: -65, brutalism: 20,
    },
    variants: [
      { suffix: "round", name: "Bauhaus Primary · Round", over: { cornerSoftness: 70, geometry: 30 } },
    ],
  },
  {
    base: "luxury-dark",
    name: "Luxury Dark",
    family: "Luxury editorial",
    v: {
      tone: 75, density: -35, complexity: -10, saturation: -45, temperature: 55,
      cornerSoftness: -15, depth: 25, typeContrast: 80, typePersonality: 75,
      geometry: -10, gridStrictness: -30, brutalism: -55,
    },
    variants: [
      { suffix: "cool", name: "Luxury Dark · Cool", over: { temperature: -40 } },
    ],
  },
];

function build(): Reference[] {
  const out: Reference[] = [];
  for (const a of A) {
    out.push({ id: a.base, name: a.name, family: a.family, axes: { ...a.v } });
    for (const variant of a.variants ?? []) {
      const axes = { ...a.v } as AxisVector;
      for (const key in variant.over) {
        const k = key as keyof AxisVector;
        axes[k] = clamp(variant.over[k]!);
      }
      out.push({
        id: `${a.base}-${variant.suffix}`,
        name: variant.name,
        family: a.family,
        axes,
      });
    }
  }
  return out;
}

export const REFERENCES: Reference[] = build();
