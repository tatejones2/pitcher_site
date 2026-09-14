import { useMemo, useState } from "react";
import { PITCH_META, fmt, type Pitch, type PitchType } from "../models/pitch";
import { path, averagePath, atDistance, type Point } from "../utils/trajectory";
import { separation } from "../utils/stats";
export default function Tunnel({
  pitches,
  preview = false,
}: {
  pitches: Pitch[];
  preview?: boolean;
}) {
  const [view, setView] = useState("Side");
  const [individual, setIndividual] = useState(false);
  const [progress, setProgress] = useState(65);
  const [selected, setSelected] = useState<PitchType[]>(["FF", "SL"]);
  const all = useMemo(
    () =>
      pitches.flatMap((p) => {
        const points = path(p);
        return points ? [{ type: p.pitchType, points }] : [];
      }),
    [pitches],
  );
  const types = [...new Set(all.map((p) => p.type))];
  const active = preview ? types.slice(0, 3) : selected;
  const filtered = all.filter((p) => active.includes(p.type));
  const start = filtered.length
    ? Math.min(...filtered.map((p) => p.points[0].y))
    : 0;
  const paths = active.flatMap((type) => {
    const ps = filtered.filter((p) => p.type === type);
    return ps.length
      ? [
          {
            type,
            points: averagePath(
              ps.map((p) => p.points),
              start,
            ),
          },
        ]
      : [];
  });
  const renderPaths = individual && !preview ? filtered.slice(0, 150) : paths;
  const y = start * (1 - progress / 100);
  const pos = paths.map((p) => atDistance(p.points, y)!);
  const sep = pos.length >= 2 ? separation(pos[0], pos[1]) * 12 : undefined;
  const project = (p: Point) =>
    view === "Catcher"
      ? [330 + p.x * 55, 280 - p.z * 30]
      : view === "Top"
        ? [55 + ((start - p.y) / Math.max(start, 1)) * 550, 140 + p.x * 45]
        : [55 + ((start - p.y) / Math.max(start, 1)) * 550, 280 - p.z * 34];
  const line = (ps: Point[]) =>
    ps.map((p, i) => `${i ? "L" : "M"}${project(p).join(",")}`).join(" ");
  return (
    <div className={preview ? "tunnel-preview" : "tunnel-full"}>
      {!preview && (
        <div className="tunnel-controls">
          <div className="pitch-filters">
            {types.map((t) => (
              <button
                key={t}
                className={selected.includes(t) ? "active" : ""}
                onClick={() =>
                  setSelected(
                    selected.includes(t)
                      ? selected.filter((v) => v !== t)
                      : [...selected, t],
                  )
                }
              >
                <i style={{ background: PITCH_META[t].color }} />
                {PITCH_META[t].name}
              </button>
            ))}
          </div>
          <div className="segmented">
            {["Catcher", "Side", "Top"].map((v) => (
              <button
                key={v}
                className={view === v ? "selected" : ""}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={individual}
              onChange={(e) => setIndividual(e.target.checked)}
            />{" "}
            Individual pitches
          </label>
        </div>
      )}
      {!all.length ? (
        <div className="empty">
          Flight path unavailable.
          <small>
            This session needs nine valid trajectory coefficients in the
            confirmed coordinate convention.
          </small>
        </div>
      ) : !paths.length ? (
        <div className="empty">Select pitches to compare their paths.</div>
      ) : (
        <>
          <div className="flight-label">
            <span>{preview ? "SIDE" : view.toUpperCase()} VIEW</span>
            <span>
              {pitches[0]?.id.startsWith("demo")
                ? "SYNTHETIC DEMO TRAJECTORIES"
                : "RECONSTRUCTED FROM COEFFICIENTS"}
            </span>
          </div>
          <svg
            viewBox="0 0 660 320"
            role="img"
            aria-label="Reconstructed pitch flight paths"
          >
            <g stroke="currentColor" opacity=".13">
              {[55, 165, 275, 385, 495, 605].map((x) => (
                <line key={x} x1={x} y1="35" x2={x} y2="280" />
              ))}
              {[60, 115, 170, 225, 280].map((y) => (
                <line key={y} x1="55" y1={y} x2="605" y2={y} />
              ))}
            </g>
            {view === "Catcher" && (
              <rect
                x={330 - 0.708 * 55}
                y={280 - 3.5 * 30}
                width={1.416 * 55}
                height={2 * 30}
                stroke="currentColor"
                opacity=".4"
                fill="none"
              />
            )}
            {renderPaths.map((p, i) => (
              <path
                key={i}
                d={line(p.points)}
                stroke={PITCH_META[p.type].color}
                strokeWidth={individual ? 1 : 2.5}
                opacity={individual ? 0.4 : 1}
                fill="none"
              />
            ))}
            {paths.map((p) => {
              const point = atDistance(p.points, y)!;
              const [x, z] = project(point);
              return (
                <circle
                  key={p.type}
                  cx={x}
                  cy={z}
                  r="5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill={PITCH_META[p.type].color}
                />
              );
            })}
            <text x="55" y="309" fill="currentColor" fontSize="10">
              PATH START
            </text>
            <text
              x="605"
              y="309"
              fill="currentColor"
              fontSize="10"
              textAnchor="end"
            >
              HOME PLATE
            </text>
          </svg>
          {!preview && (
            <>
              <label className="scrubber">
                Flight position
                <input
                  aria-label="Flight position"
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(+e.target.value)}
                />
              </label>
              <div className="tunnel-readouts">
                <div>
                  <small>DISTANCE TO PLATE</small>
                  <strong>
                    {fmt(y)} <em>ft</em>
                  </strong>
                </div>
                <div>
                  <small>
                    {paths
                      .slice(0, 2)
                      .map((p) => p.type)
                      .join(" / ")}{" "}
                    SEPARATION NOW
                  </small>
                  <strong>
                    {fmt(sep)} <em>in</em>
                  </strong>
                </div>
                <div>
                  <small>PLATE SEPARATION</small>
                  <strong>
                    {fmt(
                      paths.length >= 2
                        ? separation(
                            paths[0].points[100],
                            paths[1].points[100],
                          ) * 12
                        : undefined,
                    )}{" "}
                    <em>in</em>
                  </strong>
                </div>
              </div>
              {paths.length >= 2 && (
                <div className="separation-chart">
                  <h3>
                    Separation by distance{" "}
                    <small>
                      {paths[0].type} / {paths[1].type} · inches
                    </small>
                  </h3>
                  <svg
                    viewBox="0 0 660 150"
                    role="img"
                    aria-label="Path separation versus distance to plate"
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <line
                        key={i}
                        x1="40"
                        y1={20 + i * 32}
                        x2="620"
                        y2={20 + i * 32}
                        className="gridline"
                      />
                    ))}
                    {(() => {
                      const vals = paths[0].points.map(
                        (p, i) => separation(p, paths[1].points[i]) * 12,
                      );
                      const max = Math.max(1, ...vals);
                      return (
                        <>
                          <path
                            d={vals
                              .map(
                                (v, i) =>
                                  `${i ? "L" : "M"}${40 + i * 5.8},${116 - (v / max) * 96}`,
                              )
                              .join(" ")}
                            stroke="#416648"
                            strokeWidth="2"
                            fill="none"
                          />
                          <text x="5" y="24">
                            {fmt(max, 0)}″
                          </text>
                          <text x="40" y="143">
                            {fmt(start, 0)} ft
                          </text>
                          <text x="594" y="143">
                            0 ft
                          </text>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}
              <p className="method-note">
                Paths are compared at equal downrange positions, not equal time.{" "}
                {pitches.length - all.length > 0
                  ? `${pitches.length - all.length} pitches lack valid trajectories and are excluded. `
                  : ""}
                Separation describes this sample; it is not a pitch-quality
                score.{" "}
                {individual && filtered.length > 150
                  ? "Showing the first 150 paths."
                  : ""}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
