import { PITCH_META, fmt, type Pitch } from "../models/pitch";
import { avg, separation } from "../utils/stats";
export default function MovementSeparation({ pitches }: { pitches: Pitch[] }) {
  const valid = pitches.filter(
    (p) =>
      p.horizontalBreak !== undefined && p.inducedVerticalBreak !== undefined,
  );
  const types = [...new Set(valid.map((p) => p.pitchType))];
  if (types.length < 2) return null;
  const first = types[0];
  const center = (t: typeof first) => {
    const ps = valid.filter((p) => p.pitchType === t);
    return {
      x: avg(ps, "horizontalBreak")!,
      z: avg(ps, "inducedVerticalBreak")!,
    };
  };
  return (
    <div className="movement-separation">
      <h4>MOVEMENT SEPARATION</h4>
      {types.slice(1).map((t) => (
        <div className="note-stat" key={t}>
          <span>
            {first} ↔ {t}
          </span>
          <b style={{ color: PITCH_META[t].color }}>
            {fmt(separation(center(first), center(t)))} in
          </b>
        </div>
      ))}
      <p>
        Distance between average movement shapes in two dimensions. This does
        not measure flight-path tunneling or pitch quality.
      </p>
    </div>
  );
}
