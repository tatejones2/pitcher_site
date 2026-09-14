import { useDialog } from "../hooks/useDialog";
import { X } from "lucide-react";
export const lessons: Record<
  string,
  { unit: string; text: string; why: string }
> = {
  Velocity: {
    unit: "mph",
    text: "The speed of the ball as it leaves your hand.",
    why: "More speed gives a hitter less time. Compare it alongside movement and location, rather than treating velocity as a complete measure of pitch quality.",
  },
  IVB: {
    unit: "inches",
    text: "Induced vertical break is vertical movement relative to a gravity-only reference path. A fastball with +18 inches of IVB drops about 18 inches less than that reference; it does not literally rise 18 inches.",
    why: "IVB helps describe the vertical shape of your arsenal and the differences between your fastball and secondary pitches.",
  },
  HB: {
    unit: "inches",
    text: "Horizontal break is the sideways displacement from the reference trajectory. Here, positive values point to the catcher’s right.",
    why: "Compare the horizontal shapes of your pitches. Arm-side and glove-side depend on your throwing hand.",
  },
  "Spin rate": {
    unit: "rpm",
    text: "The number of full rotations the ball would make in one minute at its measured spin speed.",
    why: "Spin rate alone does not determine movement. Spin direction, efficiency, seams, and velocity also matter.",
  },
  Extension: {
    unit: "feet",
    text: "How far in front of the pitching rubber you release the ball toward home plate.",
    why: "More extension shortens the distance the pitch travels. It can affect the time a hitter has to react.",
  },
  "Release height": {
    unit: "feet",
    text: "The height of the ball above the ground at release.",
    why: "Compare release heights across pitch types to understand whether your arsenal shares a release window.",
  },
  "Release spread": {
    unit: "inches",
    text: "The square root of the sum of squared standard deviations in release side and height, converted from feet to inches.",
    why: "A smaller spread means a tighter release cluster in this sample. This is a descriptive calculation, not an industry-standard quality score.",
  },
  "Pitch tunneling": {
    unit: "inches / feet",
    text: "How closely two pitches travel together before separating on the way to the plate.",
    why: "We compare paths at equal distances from the plate. Similar movement shapes do not necessarily mean similar flight paths.",
  },
  "Spin efficiency": {
    unit: "percent",
    text: "The share of total spin contributing to transverse spin, rather than spin around the direction of travel.",
    why: "Higher efficiency is not universally better. Some pitch shapes intentionally use more gyro spin.",
  },
  "Spin axis": {
    unit: "degrees",
    text: "The orientation of the axis around which the ball rotates, using the export’s coordinate convention.",
    why: "Interpret direction alongside movement. Vendor conventions should be checked before comparing angles.",
  },
  "Spin direction": {
    unit: "clock face",
    text: "A clock-style description of spin orientation. The interpretation depends on the vendor’s viewing convention.",
    why: "It is a compact way to describe tilt. Compare exports only after checking that they use the same convention.",
  },
  "Active spin": {
    unit: "rpm",
    text: "The portion of spin associated with transverse rotation rather than gyro rotation.",
    why: "It provides context for total spin, but does not capture every aerodynamic effect.",
  },
  "Release side": {
    unit: "feet",
    text: "The sideways position of the ball at release. Positive points to the catcher’s right in this app.",
    why: "Together with release height, it defines the release window.",
  },
  "Vertical release angle": {
    unit: "degrees",
    text: "The vertical direction the ball travels immediately after release.",
    why: "The initial direction works with speed and acceleration to determine where the pitch finishes.",
  },
  "Horizontal release angle": {
    unit: "degrees",
    text: "The sideways direction the ball travels immediately after release.",
    why: "A difference in initial aim can separate two pitches before their movement becomes obvious.",
  },
  "Vertical approach angle": {
    unit: "degrees",
    text: "The vertical angle of the pitch’s velocity as it arrives at the plate.",
    why: "Interpret it with plate height and release characteristics. A single angle is not a quality score.",
  },
  "Horizontal approach angle": {
    unit: "degrees",
    text: "The sideways angle of the pitch’s velocity at the plate.",
    why: "It adds context to location and horizontal movement.",
  },
  "Plate location": {
    unit: "feet",
    text: "The ball’s horizontal position and height at the plate reference plane.",
    why: "The displayed strike zone is a fixed illustrative zone from 1.5 to 3.5 feet, not a measured zone for a specific batter.",
  },
  "Seam-shifted wake": {
    unit: "inches, if provided",
    text: "Movement associated with seam-driven aerodynamic forces beyond a simple spin-based model.",
    why: "Only interpret this when the source provides a defined measurement. It is not inferred from spin rate alone.",
  },
  "Gyro degree": {
    unit: "degrees",
    text: "A vendor-defined measure of the spin axis relative to the direction of travel.",
    why: "Check the source definition before comparing values across devices.",
  },
};
export function Illustration({ topic = "IVB" }: { topic?: string }) {
  const spin = /spin|gyro/i.test(topic),
    release = /release|extension|location/i.test(topic),
    horizontal = topic === "HB";
  return (
    <svg
      className="lesson-art"
      viewBox="0 0 340 120"
      role="img"
      aria-label={`${topic} conceptual illustration`}
    >
      {spin ? (
        <g fill="none" stroke="#608052">
          <circle cx="170" cy="52" r="30" stroke="#c5d0bd" />
          <ellipse
            cx="170"
            cy="52"
            rx="12"
            ry="30"
            transform="rotate(30 170 52)"
          />
          <path d="M136 33 A38 38 0 0 1 207 51 m-6-5 6 5 4-8" strokeWidth="2" />
          <path d="M147 90 L192 13" strokeDasharray="3 4" />
          <text
            x="170"
            y="112"
            textAnchor="middle"
            fill="#7f9072"
            stroke="none"
            fontSize="9"
          >
            ROTATION AROUND A SPIN AXIS
          </text>
        </g>
      ) : release ? (
        <g>
          <path d="M40 83 H305 M75 83 V15" stroke="#cad4c2" fill="none" />
          <circle
            cx="112"
            cy="35"
            r="17"
            stroke="#608052"
            fill="#edf2e8"
            strokeDasharray="3 3"
          />
          {[
            [105, 31],
            [116, 39],
            [110, 42],
            [118, 30],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="#608052" />
          ))}
          <path d="M135 37 Q213 32 287 75" stroke="#608052" fill="none" />
          <text x="170" y="112" textAnchor="middle" fill="#7f9072" fontSize="9">
            RELEASE WINDOW → FLIGHT → PLATE
          </text>
        </g>
      ) : (
        <g>
          <path
            d="M25 25 Q175 30 315 88"
            stroke="#b7bcb3"
            strokeDasharray="4 5"
            fill="none"
          />
          <path
            d="M25 25 Q175 30 315 48"
            stroke="#3d6743"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="25" cy="25" r="5" fill="#3d6743" />
          <path d="M315 53 V83 m-4-4 4 4 4-4" stroke="#3d6743" fill="none" />
          <text x="170" y="112" textAnchor="middle" fontSize="9" fill="#7f9072">
            {horizontal
              ? "TOP VIEW · SIDEWAYS DISPLACEMENT"
              : topic === "IVB"
                ? "SIDE VIEW · LESS DROP THAN REFERENCE"
                : "ILLUSTRATIVE FLIGHT PATHS"}
          </text>
        </g>
      )}
    </svg>
  );
}
export function Education({
  topic,
  onClose,
}: {
  topic: string;
  onClose: () => void;
}) {
  const dialog = useDialog();
  const lesson = lessons[topic] ?? lessons["Velocity"];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <aside
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={topic}
        className="modal education"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          autoFocus
          className="close"
          aria-label="Close explanation"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">THE MORE YOU KNOW</span>
        <h2>{topic}</h2>
        <span className="tag">MEASURED IN {lesson.unit.toUpperCase()}</span>
        <p>{lesson.text}</p>
        <Illustration topic={topic} />
        <h4>WHY IT MATTERS</h4>
        <p>{lesson.why}</p>
      </aside>
    </div>
  );
}
export default function Learn({ onMetric }: { onMetric: (s: string) => void }) {
  const names = Object.keys(lessons);
  return (
    <div className="learn-grid">
      {names.map((name, i) => (
        <button
          className="learn-card"
          key={name}
          onClick={() => onMetric(name)}
        >
          <span className="eyebrow">
            {String(i + 1).padStart(2, "0")} / {lessons[name].unit}
          </span>
          <h3>
            {name} <span>↗</span>
          </h3>
          <p>{lessons[name].text}</p>
          <Illustration topic={name} />
        </button>
      ))}
    </div>
  );
}
