import { PITCH_META, fmt, type Pitch, type Metric } from "../models/pitch";
import { avg, values } from "../utils/stats";
export default function Arsenal({
  pitches,
  onMetric,
}: {
  pitches: Pitch[];
  onMetric: (s: string) => void;
}) {
  const types = [...new Set(pitches.map((p) => p.pitchType))];
  const cols: [string, Metric, string][] = [
    ["Velocity", "releaseSpeed", "mph"],
    ["IVB", "inducedVerticalBreak", "in"],
    ["HB", "horizontalBreak", "in"],
    ["Spin rate", "spinRate", "rpm"],
    ["Extension", "extension", "ft"],
  ];
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Pitch type</th>
            <th>Count</th>
            <th>Usage</th>
            {cols.map(([l, , u]) => (
              <th key={l}>
                <button onClick={() => onMetric(l)}>
                  {l} <span>↗</span>
                </button>
                <small>{u}</small>
              </th>
            ))}
            <th>
              Max velo<small>mph</small>
            </th>
          </tr>
        </thead>
        <tbody>
          {types.map((t) => {
            const ps = pitches.filter((p) => p.pitchType === t);
            return (
              <tr key={t}>
                <td>
                  <span
                    className="pitch-code"
                    style={{
                      color: PITCH_META[t].color,
                      background: `${PITCH_META[t].color}12`,
                    }}
                  >
                    {t}
                  </span>
                  <b>{PITCH_META[t].name}</b>
                </td>
                <td>{ps.length}</td>
                <td>
                  <div className="usage">
                    <i
                      style={{
                        width: `${(ps.length / pitches.length) * 70}px`,
                        background: PITCH_META[t].color,
                      }}
                    />
                    {fmt((ps.length / pitches.length) * 100, 0)}%
                  </div>
                </td>
                {cols.map(([, k]) => (
                  <td key={k}>{fmt(avg(ps, k), k === "spinRate" ? 0 : 1)}</td>
                ))}
                <td>
                  {fmt(
                    values(ps, "releaseSpeed").length
                      ? Math.max(...values(ps, "releaseSpeed"))
                      : undefined,
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!types.length && (
        <div className="empty">No pitches match these filters.</div>
      )}
    </div>
  );
}
