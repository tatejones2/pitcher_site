export const PITCH_META = {
  FF: { name: "Four-seam", color: "#db543f" },
  SI: { name: "Sinker", color: "#d18a39" },
  FC: { name: "Cutter", color: "#a26137" },
  SL: { name: "Slider", color: "#4277c0" },
  ST: { name: "Sweeper", color: "#d75a99" },
  CU: { name: "Curveball", color: "#8a6bb5" },
  CH: { name: "Changeup", color: "#399c78" },
  FS: { name: "Splitter", color: "#319aa4" },
  KC: { name: "Knuckle curve", color: "#7454a6" },
  OTHER: { name: "Other", color: "#858b87" },
} as const;
export type PitchType = keyof typeof PITCH_META;
export const numericFields = [
  "releaseSpeed",
  "zoneSpeed",
  "effectiveVelocity",
  "spinRate",
  "spinAxis",
  "spinEfficiency",
  "activeSpinRate",
  "inducedVerticalBreak",
  "verticalBreak",
  "horizontalBreak",
  "releaseHeight",
  "releaseSide",
  "extension",
  "verticalReleaseAngle",
  "horizontalReleaseAngle",
  "plateHeight",
  "plateSide",
  "verticalApproachAngle",
  "horizontalApproachAngle",
  "x0",
  "y0",
  "z0",
  "vx0",
  "vy0",
  "vz0",
  "ax0",
  "ay0",
  "az0",
  "gyroDegree",
  "verticalSSWBreak",
  "horizontalSSWBreak",
] as const;
export type Metric = (typeof numericFields)[number];
export type Pitch = {
  id: string;
  source: "trackman" | "rapsodo" | "generic";
  pitchType: PitchType;
  pitchTypeRaw?: string;
  pitcherName: string;
  pitcherHand?: "R" | "L";
  date?: string;
  spinDirection?: string;
  raw: Record<string, unknown>;
} & Partial<Record<Metric, number>>;
export interface Session {
  id: string;
  name: string;
  date: string;
  demo: boolean;
  pitches: Pitch[];
}
export const fmt = (n: number | undefined, d = 1) =>
  n === undefined || !Number.isFinite(n)
    ? "—"
    : n.toLocaleString("en-US", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });
