import type { CSSProperties } from "react";
import type { AxisVector } from "../types";
import { deriveStyle } from "../lib/render";

// A small UI kit rendered at full fidelity from the profile's tokens, so the
// taste is shown as real components — not just described.
export function PreviewGallery({ axes }: { axes: AxisVector }) {
  const s = deriveStyle(axes);
  const p = s.palette;
  const grad = s.gradientStrength > 0.45;
  const last = p.accents[p.accents.length - 1];
  const primaryBg = grad ? `linear-gradient(135deg, ${p.primary.css}, ${last.css})` : p.primary.css;
  const tt = (on: boolean): CSSProperties => (on ? { textTransform: "uppercase", letterSpacing: "0.04em" } : {});

  const surface: CSSProperties = {
    background: p.surface.css,
    border: `${Math.max(1, s.borderWidth - 1)}px solid ${p.border.css}`,
    borderRadius: s.radius,
    boxShadow: s.shadowSm,
    padding: s.pad,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  };
  const btn: CSSProperties = {
    fontFamily: s.bodyFont,
    fontWeight: Math.max(600, s.weightBody),
    fontSize: 14,
    padding: "9px 16px",
    borderRadius: s.radius,
    border: "none",
    background: primaryBg,
    color: p.primaryFg.css,
    boxShadow: s.shadowSm,
    cursor: "default",
    ...tt(s.uppercaseNav),
  };
  const ghost: CSSProperties = { ...btn, background: "transparent", color: p.text.css, border: `${Math.max(1, s.borderWidth)}px solid ${p.border.css}`, boxShadow: "none" };
  const chip = (bg: string, fg: string, border?: string): CSSProperties => ({
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 999,
    background: bg,
    color: fg,
    ...(border ? { border } : {}),
  });
  const icon = (c: string): CSSProperties => ({
    width: 24,
    height: 24,
    flexShrink: 0,
    borderRadius: s.blobness > 0.6 ? "50%" : s.radius * 0.6,
    background: c,
  });
  const cardHead: CSSProperties = { display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" };
  const titleStyle: CSSProperties = {
    fontFamily: s.headingFont,
    fontWeight: s.weightHeading,
    fontSize: s.bodySize + 1,
    ...tt(s.uppercaseHead),
  };

  return (
    <div
      style={{
        background: p.bg.css,
        color: p.text.css,
        fontFamily: s.bodyFont,
        fontWeight: s.weightBody,
        border: `1px solid ${p.border.css}`,
        borderRadius: s.cardRadius + 4,
        padding: s.pad * 1.3,
        display: "flex",
        flexDirection: "column",
        gap: s.gap * 1.2,
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontFamily: s.headingFont, fontWeight: s.weightHeading, fontSize: Math.round(s.bodySize * s.typeScale), letterSpacing: `${s.letterSpacing}em`, ...tt(s.uppercaseHead) }}>
          Components
        </h3>
        <p style={{ margin: "6px 0 0", color: p.textMuted.css, fontSize: s.bodySize }}>Real UI rendered from your tokens.</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: s.gap * 0.7, alignItems: "center" }}>
        <span style={btn}>Primary</span>
        <span style={ghost}>Secondary</span>
        {p.accents.map((ac, i) => (
          <span key={i} style={chip(ac.css, p.primaryFg.css)}>
            {["Badge", "Tag", "New"][i] ?? "Tag"}
          </span>
        ))}
      </div>

      <input
        readOnly
        value="hello@studio.com"
        style={{
          fontFamily: s.bodyFont,
          fontSize: s.bodySize,
          padding: "10px 14px",
          borderRadius: s.radius,
          border: `${Math.max(1, s.borderWidth)}px solid ${p.border.css}`,
          background: p.bg.css,
          color: p.text.css,
          width: "100%",
          boxSizing: "border-box",
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: s.gap }}>
        {/* both cards: a header row with the title at the top, so they line up */}
        <div style={surface}>
          <div style={cardHead}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={icon(p.primary.css)} />
              <strong style={titleStyle}>Feature</strong>
            </div>
          </div>
          <p style={{ margin: 0, color: p.textMuted.css, fontSize: s.bodySize - 1, lineHeight: 1.5 }}>
            A short supporting line that shows body copy in your type.
          </p>
          <span style={{ ...btn, fontSize: 13, padding: "7px 13px", alignSelf: "flex-start" }}>Action</span>
        </div>

        <div style={surface}>
          <div style={cardHead}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={icon(last.css)} />
              <strong style={titleStyle}>Alerts</strong>
            </div>
            <div style={{ width: 40, height: 22, borderRadius: 999, background: primaryBg, position: "relative", boxShadow: s.shadowSm, flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: p.primaryFg.css }} />
            </div>
          </div>
          {["Weekly summary", "Mentions"].map((t) => (
            <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: s.bodySize - 1 }}>
              <span>{t}</span>
              <span style={chip(p.surfaceAlt.css, p.textMuted.css, `1px solid ${p.border.css}`)}>on</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
