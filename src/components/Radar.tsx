import type { AxisDriver } from "../types";
import { AXIS_IDS, AXIS_BY_ID } from "../lib/axes";

// Radar of conjoint importance (|part-worth|, 0..1) across the axes — shows at
// a glance which axes actually drove the choices.
export function Radar({ drivers, size = 280 }: { drivers: AxisDriver[]; size?: number }) {
  const imp = new Map(drivers.map((d) => [d.id, d.importance]));
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 46;
  const n = AXIS_IDS.length;

  const angle = (i: number) => (-90 + (i * 360) / n) * (Math.PI / 180);
  const pt = (i: number, r: number) => ({
    x: cx + Math.cos(angle(i)) * r,
    y: cy + Math.sin(angle(i)) * r,
  });

  const poly = AXIS_IDS.map((id, i) => {
    const p = pt(i, (imp.get(id) ?? 0) * R);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-label="Axis importance radar">
      {[0.5, 1].map((ring) => (
        <circle key={ring} cx={cx} cy={cy} r={R * ring} fill="none" stroke="var(--border)" strokeWidth={1} />
      ))}
      {AXIS_IDS.map((id, i) => {
        const edge = pt(i, R);
        const label = pt(i, R + 18);
        const anchor = label.x < cx - 4 ? "end" : label.x > cx + 4 ? "start" : "middle";
        return (
          <g key={id}>
            <line x1={cx} y1={cy} x2={edge.x} y2={edge.y} stroke="var(--border-soft)" strokeWidth={1} />
            <text
              x={label.x}
              y={label.y}
              fontSize={10}
              fill="var(--faint)"
              textAnchor={anchor}
              dominantBaseline="middle"
            >
              {AXIS_BY_ID[id].label}
            </text>
          </g>
        );
      })}
      <polygon points={poly} fill="var(--accent)" fillOpacity={0.28} stroke="var(--accent)" strokeWidth={2} />
      {AXIS_IDS.map((id, i) => {
        const p = pt(i, (imp.get(id) ?? 0) * R);
        return <circle key={id} cx={p.x} cy={p.y} r={2.5} fill="var(--accent)" />;
      })}
    </svg>
  );
}
