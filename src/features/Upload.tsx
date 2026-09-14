import { useDialog } from "../hooks/useDialog";
import { useMemo, useRef, useState } from "react";
import { UploadCloud, X, Check, ArrowRight, FileText } from "lucide-react";
import {
  parseCSV,
  mapColumns,
  normalize,
  detectVendor,
  fields,
} from "../data/import";
import type { Session } from "../models/pitch";
export default function Upload({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (s: Session[]) => void;
}) {
  const dialog = useDialog();
  const input = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ReturnType<typeof parseCSV>>();
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [units, setUnits] = useState<"imperial" | "metric">("imperial");
  const [confirmed, setConfirmed] = useState(false);
  const [drag, setDrag] = useState(false);
  const preview = useMemo(
    () =>
      parsed
        ? normalize(parsed.rows, mapping, detectVendor(parsed.headers), units)
        : undefined,
    [parsed, mapping, units],
  );
  async function read(file?: File) {
    if (!file) return;
    setError("");
    if (!/\.csv$/i.test(file.name)) {
      setError(
        "Please choose a CSV export. Excel files can be saved as CSV first.",
      );
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Choose a file smaller than 20 MB.");
      return;
    }
    try {
      const p = parseCSV(await file.text());
      setParsed(p);
      setName(file.name.replace(/\.csv$/i, ""));
      const auto = mapColumns(p.headers);
      try {
        const saved = JSON.parse(
          localStorage.getItem("pitchlab-mapping-" + p.headers.join("|")) ??
            "null",
        );
        setMapping(saved ?? auto);
      } catch {
        setMapping(auto);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function finish() {
    if (!parsed || !preview) return;
    try {
      localStorage.setItem(
        "pitchlab-mapping-" + parsed.headers.join("|"),
        JSON.stringify(mapping),
      );
    } catch {
      /* Import still works without preference storage. */
    }
    const dates = [...new Set(preview.pitches.map((p) => p.date || "Undated"))];
    onImport(
      dates.map((date) => ({
        id: crypto.randomUUID(),
        name: dates.length > 1 ? `${name} · ${date}` : name,
        date,
        demo: false,
        pitches: preview.pitches.filter((p) => (p.date || "Undated") === date),
      })),
    );
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={dialog}
        className="modal upload-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Import pitch data"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <button className="close" aria-label="Close import" onClick={onClose}>
          <X size={20} />
        </button>
        <span className="eyebrow">YOUR NEXT SESSION STARTS HERE</span>
        <h2>Bring your pitches in.</h2>
        <p>TrackMan, Rapsodo, or your own CSV export.</p>
        <input
          ref={input}
          hidden
          type="file"
          accept=".csv"
          onChange={(e) => read(e.target.files?.[0])}
        />
        {!parsed ? (
          <button
            className={`dropzone ${drag ? "dragging" : ""}`}
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              read(e.dataTransfer.files[0]);
            }}
          >
            <UploadCloud size={34} />
            <strong>Drop your CSV here</strong>
            <span>or click to browse files</span>
            <small>CSV · Up to 20 MB</small>
          </button>
        ) : (
          <>
            <div className="file-summary">
              <FileText />
              <div>
                <b>{name}</b>
                <small>
                  {parsed.rows.length} rows · {detectVendor(parsed.headers)}{" "}
                  format · {Object.values(mapping).filter(Boolean).length}{" "}
                  mapped fields
                </small>
              </div>
              <button onClick={() => input.current?.click()}>Change</button>
            </div>
            <div className="mapping">
              <div className="mapping-title">
                REVIEW COLUMN MAPPING <span>Missing metrics are optional</span>
              </div>
              {fields
                .filter(
                  (f) =>
                    [
                      "pitchType",
                      "pitcherName",
                      "releaseSpeed",
                      "inducedVerticalBreak",
                      "horizontalBreak",
                      "releaseHeight",
                      "releaseSide",
                      "plateHeight",
                      "plateSide",
                      "spinRate",
                    ].includes(f) || mapping[f],
                )
                .map((f) => (
                  <label key={f}>
                    {f.replace(/([A-Z])/g, " $1")}
                    <select
                      value={mapping[f] ?? ""}
                      onChange={(e) =>
                        setMapping({ ...mapping, [f]: e.target.value })
                      }
                    >
                      <option value="">Not available</option>
                      {parsed.headers.map((h) => (
                        <option key={h}>{h}</option>
                      ))}
                    </select>
                  </label>
                ))}
            </div>
            <label className="unit-select">
              Source units
              <select
                value={units}
                onChange={(e) => setUnits(e.target.value as typeof units)}
              >
                <option value="imperial">
                  mph · inches of break · feet of position
                </option>
                <option value="metric">
                  km/h · cm of break · metres of position
                </option>
              </select>
            </label>
            <label className="confirmation">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              I confirm the source units. Signed positions use catcher-view
              right as positive; trajectory y decreases toward a plate plane of
              0.
            </label>
            {preview && (
              <div className="import-notes">
                {new Set(preview.pitches.map((p) => p.pitcherName)).size}{" "}
                pitcher(s) ·{" "}
                {new Set(preview.pitches.map((p) => p.date || "Undated")).size}{" "}
                session date(s). All rows are retained.
                {[...parsed.errors, ...preview.warnings].length > 0 && (
                  <details>
                    <summary>
                      {parsed.errors.length + preview.warnings.length} import
                      warnings — review rows
                    </summary>
                    <ul>
                      {[...parsed.errors, ...preview.warnings].map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
            <button
              className="primary wide"
              disabled={!mapping.pitchType || !confirmed}
              onClick={finish}
            >
              Import {preview?.pitches.length} pitches <ArrowRight size={17} />
            </button>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="privacy">
          <Check size={14} /> Your data stays in your browser. No account. No
          upload to a server.
        </div>
      </section>
    </div>
  );
}
