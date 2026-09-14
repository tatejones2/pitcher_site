import { useState } from "react";
import { PITCH_META, fmt, type Session, type Metric } from "../models/pitch";
import { avg } from "../utils/stats";
export default function Sessions({
  sessions,
  pitcher,
  onSelect,
  onUpload,
}: {
  sessions: Session[];
  pitcher: string;
  onSelect: (id: string) => void;
  onUpload: () => void;
}) {
  const [a, setA] = useState(sessions[0]?.id);
  const [b, setB] = useState(sessions[1]?.id ?? sessions[0]?.id);
  const metrics: [Metric, string, string][] = [
    ["releaseSpeed", "Velocity", "mph"],
    ["inducedVerticalBreak", "IVB", "in"],
    ["horizontalBreak", "HB", "in"],
    ["spinRate", "Spin rate", "rpm"],
    ["extension", "Extension", "ft"],
    ["releaseHeight", "Release height", "ft"],
    ["releaseSide", "Release side", "ft"],
  ];
  const sa = sessions.find((s) => s.id === a),
    sb = sessions.find((s) => s.id === b);
  return (
    <>
      <div className="sessions-list">
        {sessions.map((s) => (
          <button
            className="session-card"
            key={s.id}
            onClick={() => onSelect(s.id)}
          >
            <span className="eyebrow">
              {s.demo ? "FICTIONAL DEMO" : "IMPORTED SESSION"}
            </span>
            <h3>{s.name} ↗</h3>
            <p>
              {s.date} · {s.pitches.length} pitches
            </p>
          </button>
        ))}
        <button className="session-card add-session" onClick={onUpload}>
          + Import another session
        </button>
      </div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Compare sessions</h3>
            <p>
              {pitcher} · Changes describe differences, not improvement or
              decline.
            </p>
          </div>
        </div>
        <div className="comparison-selects">
          <select
            aria-label="First comparison session"
            value={a}
            onChange={(e) => setA(e.target.value)}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.date}
              </option>
            ))}
          </select>
          <span>versus</span>
          <select
            aria-label="Second comparison session"
            value={b}
            onChange={(e) => setB(e.target.value)}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.date}
              </option>
            ))}
          </select>
        </div>
        {a === b ? (
          <div className="empty">Choose two different sessions to compare.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Pitch</th>
                  {metrics.map(([, l]) => (
                    <th key={l}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(PITCH_META)
                  .filter(
                    ([t]) =>
                      sa?.pitches.some(
                        (p) => p.pitchType === t && p.pitcherName === pitcher,
                      ) ||
                      sb?.pitches.some(
                        (p) => p.pitchType === t && p.pitcherName === pitcher,
                      ),
                  )
                  .map(([t, m]) => (
                    <tr key={t}>
                      <td style={{ color: m.color }}>{m.name}</td>
                      {metrics.map(([key, , unit]) => {
                        const v1 = avg(
                            sa?.pitches.filter(
                              (p) =>
                                p.pitchType === t && p.pitcherName === pitcher,
                            ) ?? [],
                            key,
                          ),
                          v2 = avg(
                            sb?.pitches.filter(
                              (p) =>
                                p.pitchType === t && p.pitcherName === pitcher,
                            ) ?? [],
                            key,
                          );
                        return (
                          <td key={key}>
                            <small>
                              {fmt(v1)} → {fmt(v2)}
                            </small>
                            <b>
                              {v1 !== undefined && v2 !== undefined
                                ? `${v2 - v1 >= 0 ? "+" : ""}${fmt(v2 - v1)} ${unit}`
                                : "—"}
                            </b>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
