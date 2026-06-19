import type { CSSProperties } from "react";
import type { AxisVector, Reference } from "../types";
import { deriveStyle } from "../lib/render";

// Renders a reference as a believable landing-page screenshot inside a browser
// window. Everything visual is derived from the axis vector, so what the user
// judges *is* the tagging — but it now reads unmistakably as a website: chrome
// bar, nav, hero with a product image, logo cloud, feature cards and a footer.

const HEADLINES = [
  "Build calmly.",
  "Less, but better.",
  "Ship the feeling.",
  "Work, beautifully.",
  "Make it yours.",
  "Bold by default.",
  "Designed for focus.",
  "Quietly powerful.",
];
const SUBS = [
  "Everything your team needs to launch faster, together.",
  "The all-in-one toolkit for modern product teams.",
  "Turn ideas into polished products in days, not months.",
  "A calmer way to design, build and grow.",
  "Beautiful by default, flexible when you need it.",
];
const NAV = ["Product", "Pricing", "About", "Docs"];
const CTAS = ["Get started", "Start free", "Try it", "Book a demo"];
const EYEBROWS = ["New", "Now in beta", "v2.0", "Introducing"];
const FEATURES = ["Fast", "Secure", "Flexible", "Simple", "Scalable", "Refined"];
const FOOTER = ["Privacy", "Terms", "Careers", "Contact"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Bar({ w, color, h = 6, radius = 3, op = 0.5 }: { w: string; color: string; h?: number; radius?: number; op?: number }) {
  return <div style={{ width: w, height: h, background: color, borderRadius: Math.min(radius, h / 2), opacity: op }} />;
}

export function StimulusCard({ reference, axes }: { reference?: Reference; axes?: AxisVector }) {
  const vec = (reference?.axes ?? axes)!;
  const id = reference?.id ?? "profile";
  const s = deriveStyle(vec);
  const p = s.palette;
  const seed = hash(id);
  const pick = <T,>(arr: T[], off = 0) => arr[(seed + off) % arr.length];

  const centered = s.asymmetry < 0.45;
  const showLogos = s.richness >= 0.32;
  const showFeatures = s.richness >= 0.48;
  const domain = `${id.replace(/-.*/, "")}.com`;
  const mediaRadius = s.blobness > 0.6 ? Math.max(s.radius, 14) : s.radius;

  const frame: CSSProperties = {
    width: "100%",
    aspectRatio: "5 / 6",
    overflow: "hidden",
    borderRadius: s.cardRadius + 4,
    border: `1px solid ${p.isDark ? "#2a2f3a" : "#d8dce5"}`,
    background: p.surfaceAlt.css,
    boxShadow: "0 10px 30px rgba(8,10,20,0.35)",
    display: "flex",
    flexDirection: "column",
    fontFamily: s.bodyFont,
    color: p.text.css,
  };

  const chrome: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 10px",
    height: 26,
    flexShrink: 0,
    background: p.surfaceAlt.css,
    borderBottom: `1px solid ${p.border.css}`,
  };
  const dot = (c: string): CSSProperties => ({ width: 8, height: 8, borderRadius: "50%", background: c });

  const page: CSSProperties = {
    flex: 1,
    overflow: "hidden",
    background: p.bg.css,
    padding: s.pad,
    display: "flex",
    flexDirection: "column",
    gap: s.gap * 1.1,
  };

  const button: CSSProperties = {
    background: p.primary.css,
    color: p.primaryFg.css,
    fontWeight: 600,
    fontSize: s.bodySize - 2,
    padding: `${Math.round(s.pad * 0.3)}px ${Math.round(s.pad * 0.62)}px`,
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
  const heading: CSSProperties = {
    margin: 0,
    fontFamily: s.headingFont,
    fontWeight: s.weightHeading,
    fontSize: s.headingSize,
    lineHeight: 1.05,
    letterSpacing: `${s.letterSpacing}em`,
  };

  // Faux product screenshot — the main "this is a website" signal.
  const media = (
    <div
      style={{
        flex: centered ? undefined : 1,
        width: "100%",
        aspectRatio: centered ? "16 / 9" : undefined,
        minHeight: centered ? undefined : 96,
        borderRadius: mediaRadius,
        border: `${s.borderWidth}px solid ${p.border.css}`,
        background: `linear-gradient(135deg, ${p.primary.css} 0%, ${p.accent.css} 100%)`,
        boxShadow: s.shadow,
        padding: Math.round(s.pad * 0.45),
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          background: p.surface.css,
          borderRadius: Math.max(2, s.radius - 2),
          display: "flex",
          overflow: "hidden",
        }}
      >
        <div style={{ width: "26%", background: p.surfaceAlt.css, padding: 6, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ width: 12, height: 12, borderRadius: s.blobness > 0.6 ? "50%" : 3, background: p.primary.css }} />
          <Bar w="80%" color={p.textMuted.css} h={4} op={0.4} />
          <Bar w="60%" color={p.textMuted.css} h={4} op={0.4} />
          <Bar w="70%" color={p.textMuted.css} h={4} op={0.4} />
        </div>
        <div style={{ flex: 1, padding: 7, display: "flex", flexDirection: "column", gap: 5 }}>
          <Bar w="55%" color={p.text.css} h={6} op={0.7} />
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ flex: 1, height: 22, borderRadius: Math.max(2, s.radius - 3), background: p.bg.css, border: `1px solid ${p.border.css}` }} />
            <div style={{ flex: 1, height: 22, borderRadius: Math.max(2, s.radius - 3), background: p.bg.css, border: `1px solid ${p.border.css}` }} />
          </div>
          <Bar w="90%" color={p.textMuted.css} h={4} op={0.45} />
          <Bar w="75%" color={p.textMuted.css} h={4} op={0.45} />
        </div>
      </div>
    </div>
  );

  const heroText = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: s.gap * 0.7,
        alignItems: centered ? "center" : "flex-start",
        textAlign: centered ? "center" : "left",
        flex: centered ? undefined : 1,
      }}
    >
      <span
        style={{
          fontSize: s.bodySize - 4,
          fontWeight: 600,
          color: p.primary.css,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          border: `1px solid ${p.border.css}`,
          borderRadius: 999,
          padding: `2px ${Math.round(s.pad * 0.45)}px`,
        }}
      >
        {pick(EYEBROWS, 3)}
      </span>
      <h1 style={{ ...heading, maxWidth: "14ch" }}>{pick(HEADLINES)}</h1>
      <p style={{ margin: 0, fontSize: s.bodySize - 1, color: p.textMuted.css, maxWidth: "26ch", lineHeight: 1.4 }}>
        {pick(SUBS, 1)}
      </p>
      <div style={{ display: "flex", gap: s.gap * 0.6, marginTop: s.gap * 0.3 }}>
        <span style={button}>{pick(CTAS, 2)}</span>
        <span style={ghost}>Learn more</span>
      </div>
    </div>
  );

  return (
    <div style={frame} aria-label={reference?.name ?? "Synthesized style"}>
      {/* browser chrome */}
      <div style={chrome}>
        <span style={dot(s.monoAccent ? p.textMuted.css : "#ff5f57")} />
        <span style={dot(s.monoAccent ? p.textMuted.css : "#febc2e")} />
        <span style={dot(s.monoAccent ? p.textMuted.css : "#28c840")} />
        <div
          style={{
            flex: 1,
            height: 14,
            margin: "0 6px",
            borderRadius: 999,
            background: p.bg.css,
            border: `1px solid ${p.border.css}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            color: p.textMuted.css,
            letterSpacing: "0.02em",
          }}
        >
          {domain}
        </div>
      </div>

      {/* page */}
      <div style={page}>
        {/* nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: s.gap }}>
          <div style={{ display: "flex", alignItems: "center", gap: s.gap * 0.55 }}>
            <div style={{ width: s.bodySize + 5, height: s.bodySize + 5, borderRadius: s.blobness > 0.6 ? "50%" : s.radius * 0.5, background: p.primary.css }} />
            <span style={{ fontFamily: s.headingFont, fontWeight: s.weightHeading, fontSize: s.bodySize, textTransform: s.uppercaseNav ? "uppercase" : "none", letterSpacing: s.uppercaseNav ? "0.06em" : undefined }}>
              {id.replace(/-.*/, "").replace(/^\w/, (c) => c.toUpperCase())}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: s.gap * 0.75 }}>
            {NAV.slice(0, s.richness > 0.5 ? 3 : 2).map((n) => (
              <span key={n} style={{ fontSize: s.bodySize - 3, color: p.textMuted.css, textTransform: s.uppercaseNav ? "uppercase" : "none" }}>
                {n}
              </span>
            ))}
            <span style={{ ...button, fontSize: s.bodySize - 3, padding: `${Math.round(s.pad * 0.22)}px ${Math.round(s.pad * 0.5)}px` }}>
              {pick(CTAS, 5)}
            </span>
          </div>
        </div>

        {/* hero */}
        {centered ? (
          <div style={{ display: "flex", flexDirection: "column", gap: s.gap, alignItems: "center" }}>
            {heroText}
            {media}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: s.gap, alignItems: "center" }}>
            {heroText}
            {media}
          </div>
        )}

        {/* logo cloud */}
        {showLogos && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: s.gap, opacity: 0.6, paddingTop: s.gap * 0.2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ width: `${10 + (i % 3) * 3}%`, height: 8, borderRadius: 4, background: p.textMuted.css }} />
            ))}
          </div>
        )}

        {/* features */}
        {showFeatures && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: s.gap * 0.7 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: p.surface.css,
                  border: `${Math.max(1, s.borderWidth - 1)}px solid ${p.border.css}`,
                  borderRadius: s.radius,
                  boxShadow: s.shadowSm,
                  padding: s.pad * 0.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                <div style={{ width: s.bodySize + 2, height: s.bodySize + 2, borderRadius: s.blobness > 0.6 ? "50%" : s.radius * 0.5, background: i % 2 ? p.accent.css : p.primary.css }} />
                <span style={{ fontSize: s.bodySize - 3, fontWeight: 600 }}>{pick(FEATURES, i * 7)}</span>
                <Bar w="90%" color={p.textMuted.css} h={4} op={0.45} />
                <Bar w="70%" color={p.textMuted.css} h={4} op={0.45} />
              </div>
            ))}
          </div>
        )}

        {/* footer */}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: s.gap, paddingTop: s.gap * 0.5, borderTop: `1px solid ${p.border.css}` }}>
          <span style={{ fontSize: s.bodySize - 4, color: p.textMuted.css }}>© {domain}</span>
          <div style={{ display: "flex", gap: s.gap * 0.7 }}>
            {FOOTER.slice(0, 3).map((f) => (
              <span key={f} style={{ fontSize: s.bodySize - 4, color: p.textMuted.css, opacity: 0.8 }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
