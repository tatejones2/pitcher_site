import { describe, it, expect } from "vitest";
import {
  parseCSV,
  mapColumns,
  normalize,
  pitchType,
  detectVendor,
} from "../data/import";
import { generateDemoSession } from "../data/demo";
import {
  path,
  position,
  solveFlightTime,
  averagePath,
  atDistance,
} from "./trajectory";
import { convert, separation, releaseSpread, avg } from "./stats";
describe("import normalization", () => {
  it("matches punctuation and casing without confusing IVB with vertical break", () => {
    const m = mapColumns([
      " release_speed ",
      "IVB",
      "VerticalBreak",
      "Pitch Type",
    ]);
    expect(m.releaseSpeed).toBe(" release_speed ");
    expect(m.inducedVerticalBreak).toBe("IVB");
    expect(m.verticalBreak).toBe("VerticalBreak");
    expect(mapColumns(["VerticalBreak"]).inducedVerticalBreak).toBe("");
  });
  it("normalizes TrackMan rows and retains raw values", () => {
    const csv = parseCSV(
      "Pitcher,TaggedPitchType,RelSpeed,InducedVertBreak,RelHeight\nSmith,Four-Seam,92.4,17.5,6.1",
    );
    const result = normalize(
      csv.rows,
      mapColumns(csv.headers),
      detectVendor(csv.headers),
    );
    expect(result.pitches[0]).toMatchObject({
      source: "trackman",
      pitchType: "FF",
      releaseSpeed: 92.4,
      releaseHeight: 6.1,
    });
    expect(result.pitches[0].raw.RelSpeed).toBe("92.4");
  });
  it("normalizes a Rapsodo-style export with explicit metric conversion", () => {
    const csv = parseCSV(
      "Rapsodo,Pitch Type,Velocity,Release Height,HB\nyes,Changeup,144.84096,1.8288,25.4",
    );
    const p = normalize(
      csv.rows,
      mapColumns(csv.headers),
      detectVendor(csv.headers),
      "metric",
    ).pitches[0];
    expect(p.source).toBe("rapsodo");
    expect(p.pitchType).toBe("CH");
    expect(p.releaseSpeed).toBeCloseTo(90);
    expect(p.releaseHeight).toBeCloseTo(6);
    expect(p.horizontalBreak).toBeCloseTo(10);
  });
  it("keeps malformed and duplicate rows with visible warnings", () => {
    const csv = parseCSV("Pitch,Velocity\nSlider,nope\nSlider,nope");
    const r = normalize(csv.rows, mapColumns(csv.headers), "generic");
    expect(r.pitches).toHaveLength(2);
    expect(r.pitches[0].releaseSpeed).toBeUndefined();
    expect(r.warnings.some((w) => w.includes("duplicate"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("invalid releaseSpeed"))).toBe(
      true,
    );
  });
  it("supports quoted commas and missing metrics", () => {
    const csv = parseCSV('Pitcher,Pitch,Velocity\n"Smith, John",FF,91');
    expect(
      normalize(csv.rows, mapColumns(csv.headers), "generic").pitches[0]
        .pitcherName,
    ).toBe("Smith, John");
  });
  it("rejects empty CSV", () => {
    expect(() => parseCSV("")).toThrow();
  });
  it.each([
    ["4-seam", "FF"],
    ["Two Seam Fastball", "SI"],
    ["Split-Finger", "FS"],
    ["mystery", "OTHER"],
  ])("maps %s to %s", (input, expected) =>
    expect(pitchType(input)).toBe(expected),
  );
});
describe("calculations", () => {
  it("converts units", () => {
    expect(convert(160.9344, "km/h")).toBeCloseTo(100);
    expect(convert(30.48, "cm")).toBeCloseTo(12);
    expect(convert(0.3048, "m")).toBeCloseTo(1);
  });
  it("calculates 2D separation", () =>
    expect(separation({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5));
  it("only uses complete release pairs", () => {
    const p = generateDemoSession(2).pitches;
    p[0].releaseSide = 1;
    p[0].releaseHeight = 5;
    p[1].releaseSide = 3;
    p[1].releaseHeight = 7;
    expect(releaseSpread(p)).toBeCloseTo(Math.sqrt(2) * 12);
    expect(
      releaseSpread([{ ...p[0], releaseSide: undefined }]),
    ).toBeUndefined();
  });
  it("does not fabricate averages for missing fields", () =>
    expect(avg(generateDemoSession(2).pitches, "gyroDegree")).toBeUndefined());
});
describe("trajectory math", () => {
  it("handles linear motion and chooses the first positive quadratic root", () => {
    expect(solveFlightTime(50, -100, 0)).toBe(0.5);
    expect(solveFlightTime(50, -105, 20)).toBeCloseTo(0.5);
    expect(solveFlightTime(50, 10, 0)).toBeUndefined();
    expect(solveFlightTime(50, 0, 0)).toBeUndefined();
    expect(solveFlightTime(50, 0, 10)).toBeUndefined();
  });
  it("evaluates constant acceleration correctly", () => {
    const p = {
      ...generateDemoSession(1).pitches[0],
      x0: 1,
      y0: 50,
      z0: 6,
      vx0: 2,
      vy0: -100,
      vz0: 1,
      ax0: 4,
      ay0: 0,
      az0: -32,
    };
    expect(position(p, 0.5)).toEqual({ x: 2.5, y: 0, z: 2.5 });
  });
  it("all synthetic paths reach their recorded location and move toward the plate", () => {
    for (const p of generateDemoSession().pitches) {
      const ps = path(p);
      expect(ps).toHaveLength(101);
      expect(ps![0].x).toBe(p.releaseSide);
      expect(ps![0].z).toBe(p.releaseHeight);
      expect(ps![100].y).toBeCloseTo(0);
      expect(ps![100].x).toBeCloseTo(p.plateSide!);
      expect(ps![100].z).toBeCloseTo(p.plateHeight!);
      expect(ps!.every((v, i) => i === 0 || v.y < ps![i - 1].y)).toBe(true);
    }
  });
  it("rejects missing, reversed, and inconsistent coefficients", () => {
    const p = generateDemoSession(1).pitches[0];
    expect(path({ ...p, ax0: undefined })).toBeUndefined();
    expect(path({ ...p, vy0: 100 })).toBeUndefined();
    expect(path({ ...p, plateHeight: 10 })).toBeUndefined();
  });
  it("interpolates and averages at equal distances, preserving identical paths", () => {
    const ps = path(generateDemoSession(1).pitches[0])!;
    const a = averagePath([ps, ps]);
    expect(a).toHaveLength(101);
    expect(a[100].x).toBeCloseTo(ps[100].x);
    expect(atDistance(ps, ps[0].y / 2)!.y).toBeCloseTo(ps[0].y / 2);
    expect(atDistance(ps, 100)).toBeUndefined();
    expect(averagePath([])).toEqual([]);
  });
});

describe("3D coordinate mapping", () => {
  it("keeps catcher-right orientation and feet unchanged", async () => {
    const { toWorld } = await import("../features/tunneling/world");
    expect(toWorld({ x: 2, y: 54, z: 6 })).toEqual([-2, 6, 54]);
    const a = toWorld({ x: -1, y: 20, z: 2 }),
      b = toWorld({ x: 2, y: 20, z: 6 });
    expect(Math.hypot(...a.map((v, i) => v - b[i]))).toBe(5);
  });
});
