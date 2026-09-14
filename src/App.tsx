import MovementSeparation from "./components/MovementSeparation";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  ChartScatter,
  Crosshair,
  Route,
  MapPin,
  Orbit,
  CalendarDays,
  BookOpen,
  ArrowUpRight,
  Upload,
  ChevronDown,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Info,
  Menu,
  X,
} from "lucide-react";
import { PITCH_META, fmt, type Session, type PitchType } from "./models/pitch";
import { generateDemoSession } from "./data/demo";
import { avg, values, releaseSpread } from "./utils/stats";
import Scatter from "./components/Scatter";
import Arsenal from "./components/Arsenal";
import UploadModal from "./features/Upload";
import Tunnel from "./features/Tunnel";
import Learn, { Education } from "./features/Learn";
import Sessions from "./features/Sessions";
const navigation = [
  ["Dashboard", LayoutDashboard],
  ["Arsenal", Layers],
  ["Movement", ChartScatter],
  ["Release", Crosshair],
  ["Tunneling", Route],
  ["Location", MapPin],
  ["Spin", Orbit],
  ["Sessions", CalendarDays],
  ["Learn", BookOpen],
] as const;
const descriptions: Record<string, string> = {
  Dashboard: "The full picture. One pitch at a time.",
  Arsenal: "Every pitch has a purpose. Get to know yours.",
  Movement: "See the shape of your entire arsenal.",
  Release: "Different pitches. A shared starting point.",
  Tunneling: "See where your pitches travel together—and separate.",
  Location: "Where your pitches finish, from the catcher’s view.",
  Spin: "A closer look at the rotation behind your pitches.",
  Sessions: "Track the changes between your outings.",
  Learn: "Understand the numbers. Understand your pitches.",
};
export default function App() {
  const [sessions, setSessions] = useState<Session[]>([
    generateDemoSession(),
    generateDemoSession(48, -0.7),
  ]);
  const [activeId, setActiveId] = useState("demo0");
  const [pitcher, setPitcher] = useState("Alex Morgan");
  const [selected, setSelected] = useState<PitchType[]>([]);
  const [upload, setUpload] = useState(false);
  const [topic, setTopic] = useState("");
  const [filters, setFilters] = useState(false);
  const [minVelocity, setMinVelocity] = useState("");
  const [mobile, setMobile] = useState(false);
  const [notice, setNotice] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const page =
    navigation.find(
      ([n]) => `/${n.toLowerCase()}` === location.pathname,
    )?.[0] ?? "Dashboard";
  const session = sessions.find((s) => s.id === activeId) ?? sessions[0];
  const pitchers = [...new Set(session.pitches.map((p) => p.pitcherName))];
  const pitcherPitches = useMemo(
    () => session.pitches.filter((p) => p.pitcherName === pitcher),
    [session, pitcher],
  );
  const types = [...new Set(pitcherPitches.map((p) => p.pitchType))];
  const pitches = useMemo(
    () =>
      pitcherPitches.filter(
        (p) =>
          (!selected.length || selected.includes(p.pitchType)) &&
          (!minVelocity ||
            (p.releaseSpeed !== undefined &&
              p.releaseSpeed >= Number(minVelocity))),
      ),
    [pitcherPitches, selected, minVelocity],
  );
  const fastballs = pitches.filter(
    (p) => p.pitchType === "FF" || p.pitchType === "SI",
  );
  const hand = pitcherPitches[0]?.pitcherHand;
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUpload(false);
        setTopic("");
        setMobile(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  const switchSession = (id: string) => {
    const s = sessions.find((s) => s.id === id)!;
    setActiveId(id);
    if (!s.pitches.some((p) => p.pitcherName === pitcher))
      setPitcher(s.pitches[0]?.pitcherName ?? "Unknown pitcher");
    setSelected([]);
    setMinVelocity("");
  };
  const importSessions = (ss: Session[]) => {
    setSessions([...sessions, ...ss]);
    setActiveId(ss[0].id);
    setPitcher(ss[0].pitches[0].pitcherName);
    setSelected([]);
    setMinVelocity("");
    setUpload(false);
    setNotice(
      `Imported ${ss.reduce((n, s) => n + s.pitches.length, 0)} pitches. Your data is available for this browser session.`,
    );
    navigate("/dashboard");
  };
  return (
    <div className="app">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <NavLink to="/dashboard" className="brand">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          PITCH<span className="brand-light">LAB</span>
          <span className="brand-period">/</span>
        </NavLink>
        <div className="workspace-label">THE PITCHER’S WORKSPACE</div>
        <nav>
          {navigation.map(([name, Icon], i) => (
            <NavLink
              onClick={() => setMobile(false)}
              key={name}
              to={`/${name.toLowerCase()}`}
              className={() =>
                `nav-item ${page === name ? "active" : ""} ${i === 7 ? "nav-separated" : ""}`
              }
            >
              <Icon size={18} strokeWidth={1.65} />
              <span>{name}</span>
              {name === "Tunneling" && <span className="nav-new">LAB</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <ShieldCheck size={19} />
            <b>Built for your eyes only.</b>
            <p>
              Your pitch data stays
              <br />
              in your browser.
            </p>
          </div>
          <button className="sidebar-upload" onClick={() => setUpload(true)}>
            <Upload size={16} /> Import pitch data <span>+</span>
          </button>
          <div className="sidebar-footer">
            <span>PRECISION. WITH PURPOSE.</span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <b>{page}</b>
          </div>
          <div className="topbar-right">
            <span className="local-status">
              <i /> LOCAL WORKSPACE
            </span>
            <button
              className="avatar"
              title="View current pitcher"
              onClick={() =>
                document.getElementById("pitcher-selector")?.focus()
              }
            >
              {pitcher
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </button>
          </div>
        </header>
        <main>
          <div className="page-kicker">
            <span>YOUR GAME, IN FOCUS</span>
            <span>01 — PITCH ANALYTICS</span>
          </div>
          <div className="page-heading">
            <div>
              <h1>
                {page === "Dashboard"
                  ? "Know your arsenal."
                  : page === "Tunneling"
                    ? "Follow the flight."
                    : page + "."}
              </h1>
              <p>{descriptions[page]}</p>
            </div>
            <button className="primary" onClick={() => setUpload(true)}>
              <Upload size={16} /> Import data
            </button>
          </div>
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <section className="session-strip">
            <div className="pitcher-profile">
              <div className="pitcher-avatar">
                {pitcher
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <div className="pitcher-name">
                  <select
                    id="pitcher-selector"
                    aria-label="Pitcher"
                    value={pitcher}
                    onChange={(e) => {
                      setPitcher(e.target.value);
                      setSelected([]);
                    }}
                  >
                    {pitchers.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                  {session.demo && (
                    <span className="demo-badge">DEMO PITCHER</span>
                  )}
                </div>
                <p>
                  {hand ? `${hand}HP` : "Hand not provided"} <span>·</span>{" "}
                  {pitches.length} pitches <span>·</span>{" "}
                  {new Set(pitches.map((p) => p.pitchType)).size} pitch types
                </p>
              </div>
            </div>
            <div className="session-actions">
              <div className="session-select">
                <CalendarDays size={16} />
                <select
                  aria-label="Active session"
                  value={session.id}
                  onChange={(e) => switchSession(e.target.value)}
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.date}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} />
              </div>
              <button
                className={`outline ${filters ? "toggled" : ""}`}
                onClick={() => setFilters(!filters)}
              >
                <SlidersHorizontal size={15} /> Filters
              </button>
            </div>
          </section>
          {filters && (
            <div className="filter-panel">
              <label>
                Minimum velocity (mph)
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={minVelocity}
                  onChange={(e) => setMinVelocity(e.target.value)}
                  placeholder="No minimum"
                />
              </label>
              <button
                onClick={() => {
                  setSelected([]);
                  setMinVelocity("");
                }}
              >
                Reset filters
              </button>
            </div>
          )}
          <div className="pitch-filter-row">
            <div className="pitch-filters">
              <button
                className={!selected.length ? "active" : ""}
                onClick={() => setSelected([])}
              >
                All pitches <span>{pitcherPitches.length}</span>
              </button>
              {types.map((t) => (
                <button
                  key={t}
                  className={selected.includes(t) ? "active" : ""}
                  onClick={() =>
                    setSelected(
                      selected.includes(t)
                        ? selected.filter((v) => v !== t)
                        : [...selected, t],
                    )
                  }
                >
                  <i style={{ background: PITCH_META[t].color }} />
                  {PITCH_META[t].name}
                  <span>
                    {pitcherPitches.filter((p) => p.pitchType === t).length}
                  </span>
                </button>
              ))}
            </div>
            <span className="sample-label">
              {session.demo
                ? "FICTIONAL DATA · REAL POSSIBILITIES"
                : "YOUR DATA · PROCESSED LOCALLY"}
            </span>
          </div>
          {page === "Dashboard" && (
            <>
              <div className="metrics-grid">
                {[
                  {
                    label: "AVG. FASTBALL VELOCITY",
                    value: avg(fastballs, "releaseSpeed"),
                    unit: "mph",
                    topic: "Velocity",
                    note: "Four-seam & sinker",
                    metric: "01",
                  },
                  {
                    label: "FASTBALL VERTICAL BREAK",
                    value: avg(fastballs, "inducedVerticalBreak"),
                    unit: "in",
                    topic: "IVB",
                    note: "Induced vertical break",
                    metric: "02",
                  },
                  {
                    label: "AVG. FASTBALL SPIN",
                    value: avg(fastballs, "spinRate"),
                    unit: "rpm",
                    topic: "Spin rate",
                    note: "Total spin at release",
                    metric: "03",
                  },
                  {
                    label: "AVG. EXTENSION",
                    value: avg(pitches, "extension"),
                    unit: "ft",
                    topic: "Extension",
                    note: "Closer to the plate",
                    metric: "04",
                  },
                ].map((m) => (
                  <button
                    key={m.metric}
                    className="metric-card"
                    onClick={() => setTopic(m.topic)}
                  >
                    <div className="metric-label">
                      {m.label}
                      <Info size={13} />
                    </div>
                    <strong>
                      {fmt(m.value, m.unit === "rpm" ? 0 : 1)}
                      <span>{m.unit}</span>
                    </strong>
                    <div className="metric-foot">
                      <span>{m.note}</span>
                      <span>{m.metric}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="dashboard-charts">
                <section className="panel movement-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Movement profile</h3>
                      <p>Every pitch. Its own signature.</p>
                    </div>
                    <NavLink
                      className="icon-link"
                      aria-label="Open movement profile"
                      to="/movement"
                    >
                      <ArrowUpRight size={20} />
                    </NavLink>
                  </div>
                  <div className="plot-caption">
                    <span>CATCHER VIEW</span>
                    <span>HB × IVB</span>
                  </div>
                  <Scatter pitches={pitches} compact />
                  <div className="panel-footer">
                    <span>
                      <i className="legend-ring" /> Large dots show pitch
                      averages
                    </span>
                    <NavLink to="/movement">
                      Explore movement <ArrowRight size={13} />
                    </NavLink>
                  </div>
                </section>
                <section className="panel release-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Release window</h3>
                      <p>A consistent start for every shape.</p>
                    </div>
                    <NavLink
                      className="icon-link"
                      aria-label="Open release profile"
                      to="/release"
                    >
                      <ArrowUpRight size={20} />
                    </NavLink>
                  </div>
                  <div className="plot-caption">
                    <span>CATCHER VIEW</span>
                    <span>SIDE × HEIGHT</span>
                  </div>
                  <Scatter pitches={pitches} kind="release" compact />
                  <div className="panel-footer">
                    <span>
                      Release spread <b>{fmt(releaseSpread(pitches))} in</b>
                    </span>
                    <NavLink to="/release">
                      Explore release <ArrowRight size={13} />
                    </NavLink>
                  </div>
                </section>
              </div>
              <section className="panel arsenal-panel">
                <div className="panel-head">
                  <div>
                    <h3>
                      Your arsenal{" "}
                      <span className="count-tag">
                        {new Set(pitches.map((p) => p.pitchType)).size} PITCH
                        TYPES
                      </span>
                    </h3>
                    <p>
                      Averages tell the story. The details make the difference.
                    </p>
                  </div>
                  <NavLink className="text-link" to="/arsenal">
                    View arsenal <ArrowUpRight size={15} />
                  </NavLink>
                </div>
                <Arsenal pitches={pitches} onMetric={setTopic} />
              </section>
              <section className="tunnel-banner">
                <div>
                  <span className="eyebrow">A DIFFERENT PERSPECTIVE</span>
                  <h2>
                    Same tunnel.
                    <br />
                    Different destinations.
                  </h2>
                  <p>
                    Follow your pitches from release to plate.
                    <br />
                    See the moment their paths separate.
                  </p>
                  <NavLink to="/tunneling">
                    Explore pitch tunneling <ArrowUpRight size={17} />
                  </NavLink>
                </div>
                <Tunnel pitches={pitches} preview />
              </section>
            </>
          )}
          {page === "Arsenal" && (
            <section className="panel">
              <div className="panel-head">
                <h3>Arsenal breakdown</h3>
                <span className="eyebrow">{pitches.length} PITCHES</span>
              </div>
              <Arsenal pitches={pitches} onMetric={setTopic} />
              <div className="arsenal-summary">
                <div>
                  <small>MAX VELOCITY</small>
                  <strong>
                    {fmt(
                      values(pitches, "releaseSpeed").length
                        ? Math.max(...values(pitches, "releaseSpeed"))
                        : undefined,
                    )}{" "}
                    <em>mph</em>
                  </strong>
                </div>
                <div>
                  <small>RELEASE SPREAD</small>
                  <strong>
                    {fmt(releaseSpread(pitches))} <em>in</em>
                  </strong>
                </div>
              </div>
            </section>
          )}
          {(["Movement", "Release", "Location", "Spin"] as string[]).includes(
            page,
          ) && (
            <div className="detail-layout">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h3>
                      {page === "Movement"
                        ? "Movement profile"
                        : page === "Release"
                          ? "Release window"
                          : page === "Location"
                            ? "Plate locations"
                            : "Spin rate vs. velocity"}
                    </h3>
                    <p>
                      {page === "Spin"
                        ? "Each dot is one measured pitch."
                        : "Catcher view · positive x is to the catcher’s right."}
                    </p>
                  </div>
                  <button
                    className="icon-link"
                    aria-label="Explain this chart"
                    onClick={() =>
                      setTopic(
                        page === "Movement"
                          ? "IVB"
                          : page === "Release"
                            ? "Release spread"
                            : page === "Location"
                              ? "Plate location"
                              : "Spin rate",
                      )
                    }
                  >
                    <Info size={19} />
                  </button>
                </div>
                <Scatter
                  pitches={pitches}
                  kind={
                    page.toLowerCase() as
                      "movement" | "release" | "location" | "spin"
                  }
                />
              </section>
              <aside className="chart-notes">
                <span className="eyebrow">READ THE PICTURE</span>
                <h2>
                  {page === "Movement"
                    ? "Find your separation."
                    : page === "Release"
                      ? "One release window."
                      : page === "Location"
                        ? "Finish with intent."
                        : "More than a number."}
                </h2>
                <p>
                  {page === "Movement"
                    ? "Pitches that cluster together have similar movement shapes. The distance between clusters shows how your arsenal separates."
                    : page === "Release"
                      ? "Compare the large average markers to see whether different pitch types share a release point."
                      : page === "Location"
                        ? "The box is an illustrative strike zone, 17 inches wide and 1.5 to 3.5 feet high. It is not adjusted to a specific batter."
                        : "High spin does not automatically mean more movement. Spin direction and efficiency help complete the picture."}
                </p>
                {page === "Movement" && (
                  <MovementSeparation pitches={pitches} />
                )}
                {types.map((t) => (
                  <div className="note-stat" key={t}>
                    <span>
                      <i style={{ background: PITCH_META[t].color }} />
                      {PITCH_META[t].name}
                    </span>
                    <b>
                      {page === "Release"
                        ? `${fmt(releaseSpread(pitches.filter((p) => p.pitchType === t)))} in spread`
                        : page === "Spin"
                          ? `${fmt(
                              avg(
                                pitches.filter((p) => p.pitchType === t),
                                "spinEfficiency",
                              ),
                            )}% efficiency`
                          : `${pitches.filter((p) => p.pitchType === t).length} pitches`}
                    </b>
                  </div>
                ))}
                <button
                  className="text-link"
                  onClick={() =>
                    setTopic(
                      page === "Movement"
                        ? "HB"
                        : page === "Release"
                          ? "Release height"
                          : page === "Location"
                            ? "Plate location"
                            : "Spin efficiency",
                    )
                  }
                >
                  Understand this metric <ArrowUpRight size={16} />
                </button>
              </aside>
            </div>
          )}
          {page === "Tunneling" && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Pitch tunnel</h3>
                  <p>
                    Constant-acceleration reconstruction · shared downrange
                    positions
                  </p>
                </div>
                <button
                  className="text-link"
                  onClick={() => setTopic("Pitch tunneling")}
                >
                  How it works <Info size={15} />
                </button>
              </div>
              <Tunnel pitches={pitches} />
            </section>
          )}
          {page === "Sessions" && (
            <Sessions
              sessions={sessions}
              pitcher={pitcher}
              onSelect={(id) => {
                switchSession(id);
                navigate("/dashboard");
              }}
              onUpload={() => setUpload(true)}
            />
          )}
          {page === "Learn" && <Learn onMetric={setTopic} />}
          <footer className="main-footer">
            <span>
              <span className="footer-brand">PITCHLAB</span> A little more
              clarity. A lot more purpose.
            </span>
            <span>
              {session.demo
                ? "Demo data is synthetic and does not represent a real athlete."
                : "Imported data is kept in memory until you close or reload this page."}
            </span>
          </footer>
        </main>
      </div>
      {upload && (
        <UploadModal
          onClose={() => setUpload(false)}
          onImport={importSessions}
        />
      )}{" "}
      {topic && <Education topic={topic} onClose={() => setTopic("")} />}
    </div>
  );
}
