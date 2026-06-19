// OKLCH color helpers. We author palettes in OKLCH (perceptually uniform, and
// what Claude Design reaches for) and convert to sRGB hex for tokens + any
// renderer that needs a hex fallback.

export interface Swatch {
  L: number; // 0..1
  C: number; // chroma
  h: number; // hue degrees
  css: string; // "oklch(L C h)"
  hex: string; // "#rrggbb"
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Linear-light sRGB component -> gamma-encoded sRGB. */
function gamma(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function toHex2(v: number): string {
  return Math.round(clamp01(v) * 255)
    .toString(16)
    .padStart(2, "0");
}

/** OKLCH -> sRGB hex (Björn Ottosson's matrices). */
export function oklchToHex(L: number, C: number, h: number): string {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return `#${toHex2(gamma(r))}${toHex2(gamma(g))}${toHex2(gamma(bl))}`;
}

/** Build a swatch carrying both the oklch() CSS string and the hex value. */
export function swatch(L: number, C: number, h: number): Swatch {
  const Lr = Math.round(L * 1000) / 1000;
  const Cr = Math.round(C * 1000) / 1000;
  const hr = Math.round(h * 10) / 10;
  return {
    L: Lr,
    C: Cr,
    h: hr,
    css: `oklch(${Lr} ${Cr} ${hr})`,
    hex: oklchToHex(L, C, h),
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Map a -100..100 axis value to 0..1. */
export const unit = (v: number) => clamp01((v + 100) / 200);
