import type { CSSProperties } from "react";
import type { AxisVector } from "../types";
import { deriveStyle } from "../lib/render";

// A small UI kit rendered at full fidelity from the profile's tokens, so the
// taste is shown as real components — not just described.
export function PreviewGallery({ axes }: { axes: AxisVector }) {
  const s = deriveStyle(axes);
  const p = s.palette;

  const surface: CSSProperties = {
    background: p.surface.css,
    border: `${Math.max(1, s.borderWidth - 1)}px solid ${p.border.css}`,
    borderRadius: s.radius,
    boxShadow: s.shadowSm,
    padding: s.pad,
  };
  const btn: CSSProperties = {
    fontFamily: s.bodyFont,
    fontWeight: 600,
    fontSize: 14,
    padding: "9px 16px",
    borderRadius: s.radius,
    border: "none",
    background: p.primary.css,
    color: p.primaryFg.css,
    boxShadow: s.shadowSm,
    cursor: "default",
  };
  const ghost: CSSProperties = { ...btn, background: "transparent", color: p.text.css, border: `${Math.max(1, s.borderWidth)}px solid ${p.border.css}`, boxShadow: "none" };
  const chip = (bg: string, fg: string): CSSProperties => ({
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 999,
    background: bg,
    color: fg,
  });

  return (
    <div
      style={{
        background: p.bg.css,
        color: p.text.css,
        fontFamily: s.bodyFont,
        border: `1px solid ${p.border.css}`,
        borderRadius: s.cardRadius + 4,
        padding: s.pad * 1.3,
        display: "flex",
        flexDirection: "column",
        gap: s.gap * 1.2,
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontFamily: s.headingFont, fontWeight: s.weightHeading, fontSize: Math.round(s.bodySize * s.typeScale), letterSpacing: `${s.letterSpacing}em` }}>
          Components
        </h3>
        <p style={{ margin: "6px 0 0", color: p.textMuted.css, fontSize: s.bodySize }}>
          Real UI rendered from your tokens.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: s.gap * 0.7, alignItems: "center" }}>
        <span style={btn}>Primary</span>
        <span style={ghost}>Secondary</span>
        <span style={{ ...chip(p.primary.css, p.primaryFg.css) }}>Badge</span>
        <span style={{ ...chip(p.surfaceAlt.css, p.textMuted.css), border: `1px solid ${p.border.css}` }}>Tag</span>
        <span style={{ ...chip("transparent", p.accent.css), border: `1px solid ${p.accent.css}` }}>Accent</span>
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
        <div style={surface}>
          <div style={{ width: 26, height: 26, borderRadius: s.blobness > 0.6 ? "50%" : s.radius * 0.6, background: p.primary.css, marginBottom: 8 }} />
          <strong style={{ fontFamily: s.headingFont, fontSize: s.bodySize + 1 }}>Feature card</strong>
          <p style={{ margin: "5px 0 10px", color: p.textMuted.css, fontSize: s.bodySize - 1, lineHeight: 1.5 }}>
            A short supporting line that shows body copy in your type.
          </p>
          <span style={{ ...btn, fontSize: 13, padding: "7px 13px" }}>Action</span>
        </div>
        <div style={surface}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontFamily: s.headingFont, fontSize: s.bodySize + 1 }}>Notifications</strong>
            {/* toggle */}
            <div style={{ width: 40, height: 22, borderRadius: 999, background: p.primary.css, position: "relative", boxShadow: s.shadowSm }}>
              <div style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: p.primaryFg.css }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
            {["Weekly summary", "Mentions"].map((t) => (
              <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: s.bodySize - 1 }}>
                <span>{t}</span>
                <span style={chip(p.surfaceAlt.css, p.textMuted.css)}>on</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
