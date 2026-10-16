import React from 'react';

/**
 * Self-contained SVG chart primitives for the ESS dashboard.
 *
 * Everything is drawn inline as vector — no external images, no chart library — so the
 * graphics render crisply at any size and add no network weight.
 */

/* ------------------------------------------------------------------ sparkline ---- */
export interface SparklineProps {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  points,
  color = '#4a90e2',
  width = 92,
  height = 34,
}) => {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => [i * step, height - ((p - min) / span) * (height - 6) - 3]);
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* --------------------------------------------------------------- donut chart ---- */
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 168,
  thickness = 22,
  centerLabel,
  centerSub,
}) => {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f6" strokeWidth={thickness} />
        {total > 0 &&
          segments.map((s, i) => {
            const frac = Math.max(0, s.value) / total;
            const dash = `${(frac * c).toFixed(2)} ${(c - frac * c).toFixed(2)}`;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += frac * c;
            return el;
          })}
      </g>
      {centerLabel && (
        <text x="50%" y="47%" textAnchor="middle" fontSize="17" fontWeight="800" fill="#1b2a41">
          {centerLabel}
        </text>
      )}
      {centerSub && (
        <text x="50%" y="60%" textAnchor="middle" fontSize="10" fontWeight="600" fill="#8a94a6">
          {centerSub}
        </text>
      )}
    </svg>
  );
};

/* ------------------------------------------------------------ area line chart ---- */
export interface AreaLineChartProps {
  series: { name: string; color: string; points: number[] }[];
  labels: string[];
  height?: number;
  /** Index of the point to mark with a tooltip, or -1 for none. */
  markerIndex?: number;
  markerLabel?: string;
  formatValue?: (n: number) => string;
}

export const AreaLineChart: React.FC<AreaLineChartProps> = ({
  series,
  labels,
  height = 210,
  markerIndex = -1,
  markerLabel,
  formatValue = (n) => String(n),
}) => {
  const W = 640;
  const H = height;
  const padL = 8;
  const padR = 8;
  const padT = 14;
  const padB = 26;
  const all = series.flatMap((s) => s.points);
  if (!all.length) return null;
  const max = Math.max(...all) || 1;
  const n = Math.max(...series.map((s) => s.points.length));
  const step = (W - padL - padR) / Math.max(1, n - 1);
  const x = (i: number) => padL + i * step;
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);

  const toPath = (pts: number[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(' ');

  const primary = series[0];
  const areaPath = `${toPath(primary.points)} L${x(primary.points.length - 1).toFixed(1)},${(H - padB).toFixed(1)} L${padL},${(H - padB).toFixed(1)} Z`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="ess-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary.color} stopOpacity="0.26" />
          <stop offset="100%" stopColor={primary.color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* horizontal guides */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padL}
          x2={W - padR}
          y1={padT + f * (H - padT - padB)}
          y2={padT + f * (H - padT - padB)}
          stroke="#f1f4f9"
          strokeWidth="1"
        />
      ))}

      <path d={areaPath} fill="url(#ess-area)" />
      {series.map((s, i) => (
        <path
          key={i}
          d={toPath(s.points)}
          fill="none"
          stroke={s.color}
          strokeWidth={i === 0 ? 2.4 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={i === 0 ? 1 : 0.85}
        />
      ))}

      {/* marker + tooltip */}
      {markerIndex >= 0 && primary.points[markerIndex] !== undefined && (
        <g>
          <line
            x1={x(markerIndex)}
            x2={x(markerIndex)}
            y1={padT}
            y2={H - padB}
            stroke="#c9d3e0"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle cx={x(markerIndex)} cy={y(primary.points[markerIndex])} r="4.5" fill={primary.color} stroke="#fff" strokeWidth="2" />
          {markerLabel && (
            <g transform={`translate(${Math.min(x(markerIndex) + 8, W - 130)}, ${Math.max(y(primary.points[markerIndex]) - 34, 4)})`}>
              <rect width="122" height="28" rx="7" fill="#ffffff" stroke="#e6ebf3" />
              <text x="10" y="18" fontSize="12" fontWeight="800" fill="#1b2a41">
                {markerLabel}
              </text>
            </g>
          )}
        </g>
      )}

      {/* x labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 8}
          textAnchor="middle"
          fontSize="9.5"
          fill="#9aa4b6"
          fontWeight="600"
        >
          {l}
        </text>
      ))}
    </svg>
  );
};

/* --------------------------------------------------------------- mini bar chart ---- */
export const MiniBars: React.FC<{ values: number[]; color?: string; height?: number }> = ({
  values,
  color = '#4a90e2',
  height = 34,
}) => {
  const max = Math.max(...values, 1);
  return (
    <svg width={values.length * 7} height={height} viewBox={`0 0 ${values.length * 7} ${height}`} aria-hidden="true">
      {values.map((v, i) => {
        const h = Math.max(3, (v / max) * (height - 4));
        return <rect key={i} x={i * 7} y={height - h} width="4.5" height={h} rx="2" fill={color} opacity={0.35 + 0.65 * (v / max)} />;
      })}
    </svg>
  );
};
