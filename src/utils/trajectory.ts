import type { Pitch } from "../models/pitch";
import { mean, separation } from "./stats";
export interface Point {
  x: number;
  y: number;
  z: number;
}
export function solveFlightTime(
  y: number,
  v: number,
  a: number,
  target = 0,
): number | undefined {
  if (Math.abs(a) < 1e-8) {
    const t = (target - y) / v;
    return Number.isFinite(t) && t > 0 ? t : undefined;
  }
  const d = v * v - 2 * a * (y - target);
  if (d < 0) return;
  const roots = [(-v - Math.sqrt(d)) / a, (-v + Math.sqrt(d)) / a].filter(
    (t) => t > 0 && Number.isFinite(t),
  );
  return roots.length ? Math.min(...roots) : undefined;
}
export function position(p: Pitch, t: number): Point {
  return {
    x: p.x0! + p.vx0! * t + 0.5 * p.ax0! * t * t,
    y: p.y0! + p.vy0! * t + 0.5 * p.ay0! * t * t,
    z: p.z0! + p.vz0! * t + 0.5 * p.az0! * t * t,
  };
}
// Canonical coordinates: feet; y decreases toward plate (y=0), x is catcher-view right, z is up.
// Import review requires users to confirm this convention for coefficient columns.
export function path(p: Pitch): Point[] | undefined {
  if (
    ["x0", "y0", "z0", "vx0", "vy0", "vz0", "ax0", "ay0", "az0"].some(
      (k) => !Number.isFinite(p[k as keyof Pitch]),
    )
  )
    return;
  const t = solveFlightTime(p.y0!, p.vy0!, p.ay0!);
  if (!t || t > 1 || p.y0! <= 0 || p.vy0! >= 0 || p.vy0! + p.ay0! * t >= 0)
    return;
  const points = Array.from({ length: 101 }, (_, i) =>
    position(p, (t * i) / 100),
  );
  if (points.some((p) => p.z < 0 || p.z > 12)) return;
  const end = points[100];
  if (
    p.plateSide !== undefined &&
    p.plateHeight !== undefined &&
    separation(end, { x: p.plateSide, z: p.plateHeight }) > 1
  )
    return;
  return points;
}
export function atDistance(points: Point[], y: number): Point | undefined {
  if (y > points[0].y + 1e-6 || y < 0) return;
  const i = points.findIndex((p) => p.y <= y);
  if (i < 0) return points.at(-1);
  if (i === 0) return points[0];
  const a = points[i - 1],
    b = points[i],
    f = (a.y - y) / (a.y - b.y);
  return { x: a.x + (b.x - a.x) * f, y, z: a.z + (b.z - a.z) * f };
}
export function averagePath(
  paths: Point[][],
  start = Math.min(...paths.map((p) => p[0].y)),
): Point[] {
  if (!paths.length) return [];
  return Array.from({ length: 101 }, (_, i) => {
    const y = start * (1 - i / 100),
      ps = paths.map((p) => atDistance(p, y)).filter((p): p is Point => !!p);
    return { y, x: mean(ps.map((p) => p.x))!, z: mean(ps.map((p) => p.z))! };
  });
}
