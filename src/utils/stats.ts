import type { Metric, Pitch } from "../models/pitch";
export const mean = (a: number[]) =>
  a.length ? a.reduce((s, x) => s + x, 0) / a.length : undefined;
export const values = (p: Pitch[], k: Metric) =>
  p.flatMap((p) => (p[k] === undefined ? [] : [p[k]!]));
export const avg = (p: Pitch[], k: Metric) => mean(values(p, k));
export const sd = (a: number[]) => {
  const center = mean(a);
  return center === undefined
    ? undefined
    : Math.sqrt(
        a.reduce((sum, value) => sum + (value - center) ** 2, 0) / a.length,
      );
};
export const separation = (
  a: { x: number; z: number },
  b: { x: number; z: number },
) => Math.hypot(a.x - b.x, a.z - b.z);
export const releaseSpread = (p: Pitch[]) => {
  const paired = p.filter(
    (p) => p.releaseSide !== undefined && p.releaseHeight !== undefined,
  );
  return paired.length
    ? Math.hypot(
        sd(values(paired, "releaseSide"))!,
        sd(values(paired, "releaseHeight"))!,
      ) * 12
    : undefined;
};
export const convert = (n: number, unit: string) =>
  unit === "km/h"
    ? n / 1.609344
    : unit === "m"
      ? n * 3.280839895
      : unit === "cm"
        ? n / 2.54
        : n;
