import type { Session, Pitch, PitchType } from "../models/pitch";
export function generateDemoSession(count = 48, offset = 0): Session {
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const noise = (scale: number) => (rand() + rand() + rand() - 1.5) * scale;
  const types = ["FF", "SL", "CH", "CU"] as const;
  const profiles = {
    FF: [93.1, 17.4, 8.2, 2386],
    SL: [84.6, 2.1, -8.8, 2512],
    CH: [85.3, 8.3, 15.1, 1784],
    CU: [78.7, -12.3, -7.1, 2658],
  };
  const pitches: Pitch[] = Array.from({ length: count }, (_, i) => {
    const type = types[i % 12 < 5 ? 0 : i % 12 < 8 ? 1 : i % 12 < 10 ? 2 : 3];
    const [velo, ivb, hb, spin] = profiles[type];
    const speed = velo + noise(1.5) + offset;
    const x0 = -1.8 + noise(0.13),
      y0 = 54.2 + noise(0.2),
      z0 = 5.9 + noise(0.11);
    const t = (y0 / (speed * 1.46667)) * 1.04;
    const ax0 = (((hb + noise(2)) / 12) * 2) / (t * t),
      ay0 = 18,
      az0 = -32.174 + (((ivb + noise(2)) / 12) * 2) / (t * t);
    const plateSide = noise(0.8) + (type === "SL" ? -0.4 : 0.15),
      plateHeight = 2.5 + noise(0.9) + (type === "CU" ? -0.5 : 0);
    return {
      id: `demo-${offset}-${i}`,
      source: "trackman",
      pitchType: type,
      pitcherName: "Alex Morgan",
      pitcherHand: "R",
      date: offset ? "2026-09-07" : "2026-09-14",
      raw: {},
      releaseSpeed: speed,
      spinRate: spin + noise(95),
      spinEfficiency:
        type === "FF"
          ? 96 + noise(2)
          : type === "CH"
            ? 87 + noise(4)
            : 35 + noise(12),
      inducedVerticalBreak: ivb + noise(2.6),
      horizontalBreak: hb + noise(2.5),
      releaseHeight: z0,
      releaseSide: x0,
      extension: 60.5 - y0,
      plateSide,
      plateHeight,
      x0,
      y0,
      z0,
      vx0: (plateSide - x0 - 0.5 * ax0 * t * t) / t,
      vy0: -(y0 + 0.5 * ay0 * t * t) / t,
      vz0: (plateHeight - z0 - 0.5 * az0 * t * t) / t,
      ax0,
      ay0,
      az0,
    };
  });
  return {
    id: `demo${offset}`,
    name: offset ? "Previous bullpen" : "Fall bullpen",
    date: offset ? "2026-09-07" : "2026-09-14",
    demo: true,
    pitches,
  };
}
