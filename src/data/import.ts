import Papa from "papaparse";
import { numericFields, type Pitch, type PitchType } from "../models/pitch";
import { convert } from "../utils/stats";
export const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const aliases: Record<string, string[]> = {
  pitchType: [
    "TaggedPitchType",
    "AutoPitchType",
    "Pitch Type",
    "PitchName",
    "Pitch",
  ],
  pitcherName: ["Pitcher", "PitcherName", "PlayerName", "Name"],
  pitcherHand: ["PitcherThrows", "Throws", "Hand"],
  date: ["Date", "SessionDate"],
  releaseSpeed: [
    "RelSpeed",
    "ReleaseSpeed",
    "Velocity",
    "PitchVelocity",
    "PitchSpeed",
    "Speed",
  ],
  spinRate: ["SpinRate", "TotalSpin", "Spin"],
  inducedVerticalBreak: ["InducedVertBreak", "IVB", "InducedVerticalBreak"],
  verticalBreak: ["VertBreak", "VerticalBreak"],
  horizontalBreak: ["HorzBreak", "HB", "HorizontalBreak"],
  releaseHeight: ["RelHeight", "ReleaseHeight"],
  releaseSide: ["RelSide", "ReleaseSide"],
  extension: ["Extension", "ReleaseExtension"],
  plateSide: ["PlateLocSide", "PlateSide"],
  plateHeight: ["PlateLocHeight", "PlateHeight"],
  spinEfficiency: ["SpinEfficiency", "TrueSpinEfficiency"],
  spinDirection: ["SpinDirection", "Tilt"],
  verticalApproachAngle: ["VertApprAngle", "VAA"],
  horizontalApproachAngle: ["HorzApprAngle", "HAA"],
};
export const fields = [
  "pitchType",
  "pitcherName",
  "pitcherHand",
  "date",
  "spinDirection",
  ...numericFields,
];
export const mapColumns = (headers: string[]) =>
  Object.fromEntries(
    fields.map((f) => [
      f,
      headers.find((h) =>
        [f, ...(aliases[f] ?? [])].some((a) => clean(a) === clean(h)),
      ) ?? "",
    ]),
  );
export function pitchType(s: string): PitchType {
  const n = clean(s);
  const map: Record<string, PitchType> = {
    ff: "FF",
    fastball: "FF",
    fourseam: "FF",
    fourseamfastball: "FF",
    "4seam": "FF",
    "4seamfastball": "FF",
    si: "SI",
    sinker: "SI",
    twoseam: "SI",
    twoseamfastball: "SI",
    "2seam": "SI",
    fc: "FC",
    cutter: "FC",
    sl: "SL",
    slider: "SL",
    st: "ST",
    sweeper: "ST",
    cu: "CU",
    cb: "CU",
    curveball: "CU",
    curve: "CU",
    ch: "CH",
    changeup: "CH",
    change: "CH",
    fs: "FS",
    splitter: "FS",
    splitfinger: "FS",
    kc: "KC",
    knucklecurve: "KC",
  };
  return map[n] ?? "OTHER";
}
export const detectVendor = (headers: string[]): Pitch["source"] =>
  headers.some((h) => /rapsodo/i.test(h))
    ? "rapsodo"
    : headers.some((h) => /^(RelSpeed|TaggedPitchType|TrackManUID)$/i.test(h))
      ? "trackman"
      : "generic";
export function parseCSV(text: string) {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  if (!result.meta.fields?.length || !result.data.length)
    throw new Error(
      "This file contains no pitch rows. Choose a CSV with a header and at least one pitch.",
    );
  return {
    rows: result.data,
    headers: result.meta.fields,
    errors: result.errors.map((e) => `Row ${(e.row ?? 0) + 2}: ${e.message}`),
  };
}
export function normalize(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
  source: Pitch["source"],
  units: "imperial" | "metric" = "imperial",
) {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const pitches = rows.map((raw, i): Pitch => {
    const get = (k: string) => raw[mapping[k]]?.trim();
    const key = JSON.stringify(raw);
    if (seen.has(key))
      warnings.push(`Row ${i + 2}: possible duplicate; retained for review.`);
    seen.add(key);
    const p: Pitch = {
      id: crypto.randomUUID(),
      source,
      pitchType: pitchType(get("pitchType") ?? ""),
      pitchTypeRaw: get("pitchType"),
      pitcherName: get("pitcherName") || "Unknown pitcher",
      pitcherHand: /^(r|right)$/i.test(get("pitcherHand") ?? "")
        ? "R"
        : /^(l|left)$/i.test(get("pitcherHand") ?? "")
          ? "L"
          : undefined,
      date: get("date"),
      spinDirection: get("spinDirection"),
      raw,
    };
    if (p.pitchType === "OTHER")
      warnings.push(
        `Row ${i + 2}: unknown pitch type “${get("pitchType") ?? "missing"}”; retained as Other.`,
      );
    numericFields.forEach((f) => {
      const s = get(f);
      if (!s || /^(na|n\/a|null|-)$/i.test(s)) return;
      let n = Number(s.replace(/,/g, ""));
      if (!Number.isFinite(n)) {
        warnings.push(`Row ${i + 2}: invalid ${f} “${s}”; metric left empty.`);
        return;
      }
      if (units === "metric") {
        if (/Speed|Velocity/.test(f)) n = convert(n, "km/h");
        else if (/Break/.test(f)) n = convert(n, "cm");
        else if (
          /Height|Side|extension/.test(f) ||
          /^[xyz]0$|^[va][xyz]0$/.test(f)
        )
          n = convert(n, "m");
      }
      p[f] = n;
    });
    if (p.releaseSpeed === undefined)
      warnings.push(
        `Row ${i + 2}: missing velocity; retained for other charts.`,
      );
    return p;
  });
  return { pitches, warnings };
}
