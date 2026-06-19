import type { AxisScore } from "../types";
import { lerp, unit, type Swatch } from "./color";
import { deriveStyle, vectorFromScores, type RenderStyle } from "./render";

// W3C Design Tokens Community Group (DTCG) format — stable since 2025.10.
// $type/$value keys; colors expressed in OKLCH (with hex in $description for
// fallback), dimensions as { value, unit } objects.

type Token = { $type: string; $value: unknown; $description?: string };
type Group = Record<string, Token | Record<string, Token>>;

const dim = (px: number, description?: string): Token => ({
  $type: "dimension",
  $value: { value: px, unit: "px" },
  ...(description ? { $description: description } : {}),
});

const color = (s: Swatch, description: string): Token => ({
  $type: "color",
  $value: s.css,
  $description: `${description} · ${s.hex}`,
});

/** A flat, human-friendly digest used in the brief/SKILL.md token table. */
export interface TokenSummary {
  background: string;
  surface: string;
  text: string;
  primary: string;
  accent: string;
  radius: string;
  spacing: string;
  fontHeading: string;
  fontBody: string;
  shadow: string;
  borderWidth: string;
}

export interface TokenBundle {
  dtcg: Record<string, Group>;
  summary: TokenSummary;
  style: RenderStyle;
}

export function buildTokens(axes: AxisScore[]): TokenBundle {
  const vec = vectorFromScores(axes);
  const style = deriveStyle(vec);
  const p = style.palette;

  const base = style.bodySize;
  const ratio = style.typeScale;
  const sp = Math.max(4, style.gap);
  const lineHeight = Math.round(lerp(1.45, 1.72, 1 - unit(vec.density)) * 100) / 100;

  const dtcg: Record<string, Group> = {
    color: {
      background: color(p.bg, "Page background"),
      surface: color(p.surface, "Card / panel surface"),
      "surface-alt": color(p.surfaceAlt, "Secondary surface"),
      text: color(p.text, "Primary text"),
      "text-muted": color(p.textMuted, "Secondary text"),
      border: color(p.border, "Hairline / divider"),
      primary: color(p.primary, "Primary action"),
      "primary-foreground": color(p.primaryFg, "Text on primary"),
      accent: color(p.accent, "Accent / highlight"),
    },
    spacing: {
      xs: dim(Math.round(sp * 0.5)),
      sm: dim(sp),
      md: dim(Math.round(sp * 1.8)),
      lg: dim(Math.round(sp * 3)),
      xl: dim(Math.round(sp * 5)),
    },
    radius: {
      sm: dim(Math.round(style.radius * 0.5)),
      md: dim(style.radius),
      lg: dim(Math.round(style.radius * 1.6)),
    },
    typography: {
      "font-heading": { $type: "fontFamily", $value: style.headingFont },
      "font-body": { $type: "fontFamily", $value: style.bodyFont },
      "size-caption": dim(Math.round(base * 0.85)),
      "size-body": dim(base),
      "size-h3": dim(Math.round(base * ratio)),
      "size-h2": dim(Math.round(base * ratio * 1.3)),
      "size-h1": dim(Math.round(base * ratio * 1.7)),
      "weight-heading": { $type: "fontWeight", $value: style.weightHeading },
      "weight-body": { $type: "fontWeight", $value: 400 },
      "letter-spacing-heading": {
        $type: "dimension",
        $value: { value: Math.round(style.letterSpacing * 1000) / 1000, unit: "rem" },
      },
      "line-height-body": { $type: "number", $value: lineHeight },
    },
    border: {
      width: dim(style.borderWidth),
    },
    shadow: {
      sm: { $type: "shadow", $value: style.shadowSm, $description: "CSS box-shadow" },
      md: { $type: "shadow", $value: style.shadow, $description: "CSS box-shadow" },
    },
  };

  const summary: TokenSummary = {
    background: `${p.bg.css} (${p.bg.hex})`,
    surface: `${p.surface.css} (${p.surface.hex})`,
    text: `${p.text.css} (${p.text.hex})`,
    primary: `${p.primary.css} (${p.primary.hex})`,
    accent: `${p.accent.css} (${p.accent.hex})`,
    radius: `${style.radius}px`,
    spacing: `${sp}px base scale`,
    fontHeading: style.headingFont,
    fontBody: style.bodyFont,
    shadow: style.shadow,
    borderWidth: `${style.borderWidth}px`,
  };

  return { dtcg, summary, style };
}
