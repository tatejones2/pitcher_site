import { useId, useState } from "react";
import { PITCH_META, fmt, type Pitch, type Metric } from "../models/pitch";
import { avg } from "../utils/stats";
type Kind = "movement" | "release" | "location" | "spin";
const configs: Record<
  Kind,
  {
    x: Metric;
    y: Metric;
    xd: [number, number];
    yd: [number, number];
    xl: string;
    yl: string;
  }
> = {
  movement: {
    x: "horizontalBreak",
    y: "inducedVerticalBreak",
    xd: [-24, 24],
    yd: [-24, 24],
    xl: "Horizontal break (in)",
    yl: "Induced vertical break (in)",
  },
  release: {
    x: "releaseSide",
    y: "releaseHeight",
    xd: [-3, 3],
    yd: [3, 8],
    xl: "Release side (ft)",
    yl: "Release height (ft)",
  },
  location: {
    x: "plateSide",
    y: "plateHeight",
    xd: [-2.5, 2.5],
    yd: [0, 5],
    xl: "Plate side (ft)",
    yl: "Plate height (ft)",
  },
  spin: {
    x: "releaseSpeed",
    y: "spinRate",
    xd: [65, 100],
    yd: [1000, 3200],
    xl: "Velocity (mph)",
    yl: "Spin rate (rpm)",
  },
};
export default function Scatter({
  pitches,
  kind = "movement",
  compact = false,
}: {
  pitches: Pitch[];
  kind?: Kind;
  compact?: boolean;
}) {
  const [mode, setMode] = useState("Both");
  const [hover, setHover] = useState<Pitch>();
  const id = useId();
  const c = configs[kind];
  const valid = pitches.filter(
    (p) => p[c.x] !== undefined && p[c.y] !== undefined,
  );
  const types = [...new Set(valid.map((p) => p.pitchType))];
  const domain = (base: [number, number], field: Metric): [number, number] => [
    Math.min(base[0], ...valid.map((p) => p[field]! - 1)),
    Math.max(base[1], ...valid.map((p) => p[field]! + 1)),
  ];
  const releaseDomain = (field: Metric): [number, number] => {
    const center = avg(valid, field) ?? 0;
    return [
      Math.min(center - 0.65, ...valid.map((p) => p[field]! - 0.15)),
      Math.max(center + 0.65, ...valid.map((p) => p[field]! + 0.15)),
    ];
  };
  const xd = kind === "release" ? releaseDomain(c.x) : domain(c.xd, c.x),
    yd = kind === "release" ? releaseDomain(c.y) : domain(c.yd, c.y);
  const sx = (n: number) => 65 + ((n - xd[0]) / (xd[1] - xd[0])) * 330,
    sy = (n: number) => 365 - ((n - yd[0]) / (yd[1] - yd[0])) * 330;
  return (
    <div className="scatter-wrap">
      {!compact && (
        <div className="plot-toolbar">
          <div className="segmented">
            {["Individual", "Averages", "Both"].map((m) => (
              <button
                key={m}
                className={mode === m ? "selected" : ""}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <span>{valid.length} pitches plotted</span>
        </div>
      )}
      {!valid.length ? (
        <div className="empty">
          {kind[0].toUpperCase() + kind.slice(1)} data not available.
          <small>
            Import a file with {c.xl.toLowerCase()} and {c.yl.toLowerCase()}.
          </small>
        </div>
      ) : (
        <>
          <svg
            className="scatter"
            viewBox="0 0 460 425"
            role="img"
            aria-label={`${kind} scatter plot, catcher view`}
          >
            <defs>
              <clipPath id={id}>
                <rect x="65" y="35" width="330" height="330" />
              </clipPath>
            </defs>
            {Array.from({ length: 7 }, (_, i) => {
              const x = 65 + i * 55,
                y = 35 + i * 55;
              return (
                <g key={i}>
                  <line x1={x} y1="35" x2={x} y2="365" className="gridline" />
                  <line x1="65" y1={y} x2="395" y2={y} className="gridline" />
                  <text x={x} y="385" textAnchor="middle">
                    {fmt(
                      xd[0] + ((xd[1] - xd[0]) * i) / 6,
                      kind === "movement" ? 0 : 1,
                    )}
                  </text>
                  <text x="53" y={y + 4} textAnchor="end">
                    {fmt(
                      yd[1] - ((yd[1] - yd[0]) * i) / 6,
                      kind === "movement" ? 0 : 1,
                    )}
                  </text>
                </g>
              );
            })}
            {xd[0] < 0 && (
              <line
                x1={sx(0)}
                y1="35"
                x2={sx(0)}
                y2="365"
                className="zeroline"
              />
            )}
            {yd[0] < 0 && (
              <line
                x1="65"
                y1={sy(0)}
                x2="395"
                y2={sy(0)}
                className="zeroline"
              />
            )}
            {kind === "location" && (
              <g>
                <rect
                  x={sx(-0.708)}
                  y={sy(3.5)}
                  width={sx(0.708) - sx(-0.708)}
                  height={sy(1.5) - sy(3.5)}
                  fill="none"
                  stroke="#717970"
                  strokeWidth="2"
                />
                <path
                  d={`M ${sx(-0.708)} ${sy(0.25)} H ${sx(0.708)} L ${sx(0.708)} ${sy(0.05)} L ${sx(0)} ${sy(-0.1)} L ${sx(-0.708)} ${sy(0.05)} Z`}
                  fill="#dfe2da"
                />
              </g>
            )}
            <g clipPath={`url(#${id})`}>
              {mode !== "Averages" &&
                valid.map((p) => (
                  <circle
                    tabIndex={0}
                    onFocus={() => setHover(p)}
                    onBlur={() => setHover(undefined)}
                    onMouseEnter={() => setHover(p)}
                    onMouseLeave={() => setHover(undefined)}
                    key={p.id}
                    cx={sx(p[c.x]!)}
                    cy={sy(p[c.y]!)}
                    r={compact ? 4 : 4.5}
                    fill={PITCH_META[p.pitchType].color}
                    fillOpacity=".48"
                    stroke={PITCH_META[p.pitchType].color}
                    strokeWidth=".7"
                  >
                    <title>{`${PITCH_META[p.pitchType].name}: ${fmt(p[c.x])} ${c.xl}, ${fmt(p[c.y])} ${c.yl}; ${fmt(p.releaseSpeed)} mph`}</title>
                  </circle>
                ))}
              {mode !== "Individual" &&
                types.map((t) => {
                  const ps = valid.filter((p) => p.pitchType === t),
                    x = sx(avg(ps, c.x)!),
                    y = sy(avg(ps, c.y)!);
                  return (
                    <g key={t}>
                      <circle
                        cx={x}
                        cy={y}
                        r="8"
                        fill={PITCH_META[t].color}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={x + 12}
                        y={y - 10}
                        style={{ fill: PITCH_META[t].color, fontWeight: 700 }}
                      >
                        {t}
                      </text>
                    </g>
                  );
                })}
            </g>
            <text x="230" y="414" textAnchor="middle">
              {c.xl}
            </text>
            <text transform="translate(16 200) rotate(-90)" textAnchor="middle">
              {c.yl}
            </text>
          </svg>
          <div className="chart-bottom">
            {hover ? (
              <span>
                <b style={{ color: PITCH_META[hover.pitchType].color }}>
                  {PITCH_META[hover.pitchType].name}
                </b>{" "}
                · {fmt(hover.releaseSpeed)} mph · {fmt(hover.spinRate, 0)} rpm
              </span>
            ) : (
              <span>
                {kind === "spin"
                  ? "ONE DOT = ONE PITCH"
                  : "← CATCHER’S LEFT"}{" "}
              </span>
            )}
            <span>{kind === "spin" ? "" : "CATCHER’S RIGHT →"}</span>
          </div>
        </>
      )}
    </div>
  );
}
