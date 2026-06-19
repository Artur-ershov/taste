import type { CSSProperties } from "react";
import type { AxisVector, Reference } from "../types";
import { deriveStyle } from "../lib/render";

// Renders a reference as a miniature landing-page mockup. Everything visual is
// derived from the axis vector, so what the user judges *is* the tagging.

const HEADLINES = [
  "Build calmly",
  "Less, but better",
  "Bold by default",
  "Make it yours",
  "Designed for focus",
  "Taste, encoded",
  "Quietly powerful",
  "Ship the feeling",
];
const NAV = ["Work", "About", "Pricing", "Docs"];
const CTAS = ["Get started", "Try it free", "Start now", "Join"];
const EYEBROWS = ["New", "v2.0", "Featured", "Beta"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Skeleton({ width, color, radius, h = 6 }: { width: string; color: string; radius: number; h?: number }) {
  return <div style={{ width, height: h, background: color, borderRadius: Math.min(radius, h / 2), opacity: 0.55 }} />;
}

export function StimulusCard({ reference, axes }: { reference?: Reference; axes?: AxisVector }) {
  const vec = (reference?.axes ?? axes)!;
  const id = reference?.id ?? "profile";
  const s = deriveStyle(vec);
  const p = s.palette;
  const seed = hash(id);

  const navCount = s.richness > 0.5 ? 3 : 2;
  const cardCount = s.richness > 0.66 ? 3 : s.richness > 0.3 ? 2 : 0;
  const showEyebrow = s.richness > 0.45;
  const showSecondary = s.richness > 0.5;
  const centered = s.asymmetry < 0.4;
  const headline = HEADLINES[seed % HEADLINES.length];
  const cta = CTAS[(seed >> 2) % CTAS.length];

  // Organic shapes get blobby border-radius; geometric ones stay circular/square.
  const blobRadius = s.blobness > 0.55 ? "47% 53% 38% 62% / 58% 41% 59% 42%" : "50%";

  const container: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    aspectRatio: "4 / 5",
    width: "100%",
    background: p.bg.css,
    color: p.text.css,
    fontFamily: s.bodyFont,
    border: `${s.borderWidth}px solid ${p.border.css}`,
    borderRadius: s.cardRadius,
    boxShadow: s.shadow,
    padding: s.pad,
    display: "flex",
    flexDirection: "column",
    gap: s.gap,
    isolation: "isolate",
  };

  const mark: CSSProperties = {
    width: s.bodySize + 6,
    height: s.bodySize + 6,
    background: p.primary.css,
    borderRadius: s.blobness > 0.55 ? blobRadius : s.radius * 0.5,
    flexShrink: 0,
  };

  const button: CSSProperties = {
    background: p.primary.css,
    color: p.primaryFg.css,
    fontFamily: s.bodyFont,
    fontWeight: 600,
    fontSize: s.bodySize - 2,
    padding: `${Math.round(s.pad * 0.32)}px ${Math.round(s.pad * 0.7)}px`,
    borderRadius: s.radius,
    border: s.monoAccent ? `${s.borderWidth}px solid ${p.text.css}` : "none",
    whiteSpace: "nowrap",
    boxShadow: s.shadowSm,
  };

  const ghost: CSSProperties = {
    ...button,
    background: "transparent",
    color: p.text.css,
    border: `${Math.max(1, s.borderWidth)}px solid ${p.border.css}`,
    boxShadow: "none",
  };

  return (
    <div style={container} aria-label={reference?.name ?? "Synthesized style"}>
      {/* decorative shapes */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          zIndex: 0,
          top: -s.bodySize * 2,
          right: -s.bodySize * 2,
          width: s.headingSize * 3,
          height: s.headingSize * 3,
          background: p.accent.css,
          opacity: p.isDark ? 0.32 : 0.18,
          borderRadius: blobRadius,
          filter: s.palette.isDark ? "blur(2px)" : "none",
        }}
      />
      {s.richness > 0.5 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            zIndex: 0,
            bottom: -s.bodySize * 3,
            left: -s.bodySize,
            width: s.headingSize * 2.4,
            height: s.headingSize * 2.4,
            background: p.primary.css,
            opacity: 0.14,
            borderRadius: blobRadius,
          }}
        />
      )}

      {/* nav */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: s.gap }}>
        <div style={{ display: "flex", alignItems: "center", gap: s.gap * 0.6 }}>
          <div style={mark} />
          <span
            style={{
              fontFamily: s.headingFont,
              fontWeight: s.weightHeading,
              fontSize: s.bodySize + 1,
              letterSpacing: s.uppercaseNav ? "0.08em" : `${s.letterSpacing}em`,
              textTransform: s.uppercaseNav ? "uppercase" : "none",
            }}
          >
            Studio
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: s.gap * 0.8 }}>
          {NAV.slice(0, navCount).map((n) => (
            <span
              key={n}
              style={{
                fontSize: s.bodySize - 3,
                color: p.textMuted.css,
                textTransform: s.uppercaseNav ? "uppercase" : "none",
                letterSpacing: s.uppercaseNav ? "0.06em" : undefined,
              }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* hero */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: s.gap * 0.8,
          marginTop: s.gap * 0.5,
          alignItems: centered ? "center" : "flex-start",
          textAlign: centered ? "center" : "left",
          flex: cardCount === 0 ? 1 : undefined,
          justifyContent: cardCount === 0 ? "center" : undefined,
        }}
      >
        {showEyebrow && (
          <span
            style={{
              fontSize: s.bodySize - 4,
              fontWeight: 600,
              color: p.primary.css,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              border: `1px solid ${p.border.css}`,
              borderRadius: s.radius,
              padding: `2px ${Math.round(s.pad * 0.4)}px`,
            }}
          >
            {EYEBROWS[seed % EYEBROWS.length]}
          </span>
        )}
        <h2
          style={{
            margin: 0,
            fontFamily: s.headingFont,
            fontWeight: s.weightHeading,
            fontSize: s.headingSize,
            lineHeight: 1.05,
            letterSpacing: `${s.letterSpacing}em`,
            maxWidth: "11ch",
          }}
        >
          {headline}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, width: centered ? "70%" : "85%", alignItems: centered ? "center" : "flex-start" }}>
          <Skeleton width="100%" color={p.textMuted.css} radius={s.radius} />
          <Skeleton width="80%" color={p.textMuted.css} radius={s.radius} />
        </div>
        <div style={{ display: "flex", gap: s.gap * 0.6, marginTop: s.gap * 0.4 }}>
          <span style={button}>{cta}</span>
          {showSecondary && <span style={ghost}>Learn more</span>}
        </div>
      </div>

      {/* feature cards */}
      {cardCount > 0 && (
        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: `repeat(${cardCount}, 1fr)`, gap: s.gap * 0.7, marginTop: "auto" }}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <div
              key={i}
              style={{
                background: p.surface.css,
                border: `${Math.max(1, s.borderWidth - 1)}px solid ${p.border.css}`,
                borderRadius: s.radius,
                boxShadow: s.shadowSm,
                padding: s.pad * 0.55,
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
            >
              <div
                style={{
                  width: s.bodySize + 2,
                  height: s.bodySize + 2,
                  background: i % 2 ? p.accent.css : p.primary.css,
                  opacity: 0.9,
                  borderRadius: s.blobness > 0.55 ? blobRadius : s.radius * 0.5,
                }}
              />
              <Skeleton width="90%" color={p.text.css} radius={s.radius} h={5} />
              <Skeleton width="65%" color={p.textMuted.css} radius={s.radius} h={5} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
