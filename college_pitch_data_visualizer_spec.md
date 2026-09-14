# College Pitch Data Visualizer — Product & Engineering Specification

## 1. Project Overview

Build a web application for **college pitchers** that makes TrackMan and Rapsodo pitching data easier to understand.

The application should allow a pitcher to upload exported pitching data, automatically normalize the data into a common format, and then turn the raw numbers into clear visualizations, explanations, comparisons, and pitch-flight illustrations.

The core idea is:

> A pitcher should not need to be a data analyst to understand what the numbers say about his arsenal.

The product should emphasize visual learning. Do not simply show tables of numbers. Every important metric should have a chart, illustration, tooltip, short explanation, or comparison that helps a pitcher understand what it means physically.

A major feature is a **Pitch Flight / Tunneling Visualizer** that draws colored flight paths from release to home plate so a pitcher can see how different pitches share a tunnel and where they separate.

---

# 2. Primary Goals

The site should help a college pitcher answer questions such as:

- What does each TrackMan/Rapsodo metric actually mean?
- How does each pitch in my arsenal move?
- How consistent is my release point?
- Which pitches move similarly?
- Which pitches have meaningful movement separation?
- Which pitches tunnel well together?
- At what point do two pitches begin to separate?
- Does a pitch come out of the same release window as my fastball?
- How different are my pitch shapes from one bullpen/session to another?
- What changed between two sessions?
- Is my velocity, movement, release point, or spin becoming more or less consistent?
- What does induced vertical break actually look like?
- What does horizontal break actually look like?
- What does extension mean visually?
- What does approach angle mean?
- How does spin relate to movement?

---

# 3. Target User

Primary user:

- College baseball pitcher
- Familiar with terms such as fastball, slider, curveball, changeup, IVB, horizontal break, velocity, and spin
- May receive TrackMan or Rapsodo data from a team but may not fully understand how to interpret it
- Wants something more intuitive than a spreadsheet

Secondary users:

- Pitching coaches
- Baseball analysts
- High-level high school pitchers
- Trainers / player development staff

Design the first version for **individual pitchers**, not full organizational roster management.

---

# 4. Technology Requirements

## Frontend

Use:

- React
- Vite
- TypeScript
- React Router
- CSS Modules, Tailwind CSS, or a similarly maintainable styling solution

Recommended libraries:

- `papaparse` for CSV parsing
- `xlsx` for optional Excel support
- `zod` for runtime schema validation
- `zustand` for lightweight application state if needed
- `recharts` for standard charts
- `plotly.js` / `react-plotly.js` OR D3 for baseball-specific scatter plots
- `three`
- `@react-three/fiber`
- `@react-three/drei`

Use Three.js / React Three Fiber for the advanced pitch-flight visualizer if it produces a better result than a pure SVG/Canvas implementation.

Do not add heavy libraries without a clear reason.

## Initial Data Storage

For the MVP, the application can be local-first.

Use:

- browser memory for the current imported session
- `localStorage` or IndexedDB for user preferences and optionally saved sessions

Structure the code so that a backend/database can be added later.

Do not require user accounts in the first implementation unless absolutely necessary.

---

# 5. Design Language — Swiss International Style

Use **Swiss International / International Typographic Style** throughout the site.

The interface should feel:

- structured
- analytical
- clean
- editorial
- modern
- minimal
- highly legible
- grid-based
- professional enough for a college baseball program

Avoid:

- gradients everywhere
- glassmorphism
- overly rounded "SaaS dashboard" styling
- cartoon baseball graphics
- clutter
- excessive shadows
- decorative UI that does not communicate information

## Visual Characteristics

Use:

- strong typographic hierarchy
- generous whitespace
- a visible layout grid
- thin rules/dividers
- left-aligned typography
- large numerical values
- compact metric labels
- restrained use of color
- pitch colors as the main source of color within charts

Suggested font stack:

```css
font-family:
  Inter,
  "Helvetica Neue",
  Helvetica,
  Arial,
  sans-serif;
```

If a Swiss-style display font is used, it must remain highly readable.

## Layout Grid

Desktop:

- max-width around 1440px
- 12-column grid
- strong alignment between cards, charts, headings, labels, and controls

Tablet:

- 8-column grid

Mobile:

- 4-column grid

Desktop should be the priority because pitchers/coaches will often inspect this information on laptops.

## Core Colors

Base UI:

- off-white / white background
- near-black text
- neutral gray borders
- subtle gray panels

Charts should use pitch-type colors consistently.

---

# 6. Pitch Color System

Create a centralized pitch-color configuration.

Suggested defaults:

| Pitch | Color |
|---|---|
| Four-Seam Fastball | Red |
| Two-Seam / Sinker | Orange |
| Cutter | Dark orange / brown |
| Slider | Blue |
| Sweeper | Pink / magenta |
| Curveball | Purple |
| Changeup | Green |
| Splitter / Split-Finger | Teal |
| Knuckle Curve | Violet |
| Other / Unknown | Gray |

Do not scatter literal color values throughout chart components.

Create something similar to:

```ts
export const PITCH_COLORS = {
  FF: "...",
  SI: "...",
  FC: "...",
  SL: "...",
  ST: "...",
  CU: "...",
  CH: "...",
  FS: "...",
  KC: "...",
  OTHER: "..."
};
```

Users should eventually be able to customize colors.

All visualizations must use the same pitch colors.

---

# 7. Application Information Architecture

Primary navigation:

1. Dashboard
2. Arsenal
3. Movement
4. Release
5. Tunneling
6. Location
7. Spin
8. Sessions
9. Learn

A simple left sidebar works well on desktop.

Alternative: Swiss-style top navigation with a strong horizontal grid.

The uploaded session/pitcher should always remain visible in the interface.

Example header:

```text
TATE JONES
Bullpen · September 14, 2026
42 pitches

[Session ▼] [Pitcher ▼] [Filters]
```

---

# 8. Data Import

## Supported Inputs

MVP:

- `.csv`

Optional immediately afterward:

- `.xlsx`
- `.xls`

The uploader should support drag-and-drop.

Example:

```text
DROP PITCH DATA

TrackMan / Rapsodo
CSV or Excel

[Choose File]
```

## Import Workflow

1. User drops file
2. Parse headers
3. Detect likely vendor
4. Detect available metrics
5. Identify pitcher(s)
6. Identify pitch types
7. Normalize columns
8. Validate rows
9. Show import summary
10. Let user resolve unmapped columns when necessary
11. Load dashboard

Never silently discard important data.

---

# 9. TrackMan / Rapsodo Normalization Layer

Do not build chart components directly against raw CSV column names.

Build a **canonical internal pitch model**.

This is one of the most important architectural decisions in the project.

Different vendors and exports may use different names for the same concept.

For example:

```text
RelSpeed
ReleaseSpeed
Velocity
PitchSpeed
```

could all conceptually map to:

```ts
releaseSpeed
```

Create:

```text
src/
  data/
    adapters/
      trackmanAdapter.ts
      rapsodoAdapter.ts
      genericAdapter.ts
    columnAliases.ts
    normalizePitch.ts
    detectVendor.ts
```

---

# 10. Canonical Pitch Data Model

Use a TypeScript interface similar to:

```ts
export interface NormalizedPitch {
  id: string;

  source: "trackman" | "rapsodo" | "generic";

  date?: string;
  sessionId?: string;

  pitcherId?: string;
  pitcherName?: string;
  pitcherHand?: "R" | "L";

  pitchTypeRaw?: string;
  pitchType: PitchType;

  releaseSpeed?: number;
  zoneSpeed?: number;
  effectiveVelocity?: number;

  spinRate?: number;
  spinAxis?: number;
  spinDirection?: string;
  spinEfficiency?: number;
  activeSpinRate?: number;

  inducedVerticalBreak?: number;
  verticalBreak?: number;
  horizontalBreak?: number;

  releaseHeight?: number;
  releaseSide?: number;
  extension?: number;

  verticalReleaseAngle?: number;
  horizontalReleaseAngle?: number;

  plateHeight?: number;
  plateSide?: number;

  verticalApproachAngle?: number;
  horizontalApproachAngle?: number;

  // Nine-parameter trajectory model
  x0?: number;
  y0?: number;
  z0?: number;

  vx0?: number;
  vy0?: number;
  vz0?: number;

  ax0?: number;
  ay0?: number;
  az0?: number;

  // Optional vendor-specific values
  gyroDegree?: number;
  verticalSSWBreak?: number;
  horizontalSSWBreak?: number;

  raw: Record<string, unknown>;
}
```

Do not require every value.

Every chart must gracefully handle missing metrics.

---

# 11. Column Alias System

Build a dictionary that recognizes common naming variations.

Example concept:

```ts
const FIELD_ALIASES = {
  releaseSpeed: [
    "RelSpeed",
    "ReleaseSpeed",
    "Release Speed",
    "Velocity",
    "PitchVelocity"
  ],

  inducedVerticalBreak: [
    "InducedVertBreak",
    "InducedVerticalBreak",
    "IVB",
    "VerticalBreak"
  ],

  horizontalBreak: [
    "HorzBreak",
    "HorizontalBreak",
    "HB"
  ],

  releaseHeight: [
    "RelHeight",
    "ReleaseHeight",
    "Release Height"
  ],

  releaseSide: [
    "RelSide",
    "ReleaseSide",
    "Release Side"
  ]
};
```

Column matching should:

1. trim whitespace
2. remove punctuation when appropriate
3. compare case-insensitively
4. allow known aliases
5. never incorrectly guess ambiguous columns

If a field cannot be confidently mapped, provide a manual mapping UI.

---

# 12. Import Mapping Screen

If automatic mapping is incomplete, show:

```text
WE FOUND 18 OF 22 METRICS

Pitch Type       → TaggedPitchType
Velocity         → RelSpeed
Spin Rate        → SpinRate
Horizontal Break → HorzBreak
IVB              → InducedVertBreak

Release Side     → [Select column]
Plate Side       → [Select column]

[Continue]
```

Save successful custom mappings locally so future imports from the same export format can reuse them.

---

# 13. Unit Normalization

Internally establish explicit units.

Recommended canonical units:

- speed: mph
- spin: rpm
- movement: inches
- release position: feet
- plate position: feet
- extension: feet
- angles: degrees
- time: seconds
- trajectory velocities: ft/s
- trajectory accelerations: ft/s²

Never assume a value is in inches/feet without knowing the source convention.

Create conversion helpers:

```text
src/utils/units.ts
```

All tooltip labels must display units.

---

# 14. Upload Validation

Detect:

- empty file
- unreadable file
- unsupported format
- no pitch rows
- missing pitch type
- missing velocity
- duplicate rows
- malformed numeric values
- inconsistent units
- mixed pitchers
- mixed sessions

Show a useful error instead of failing silently.

Example:

```text
IMPORT WARNING

12 rows were skipped because they did not contain a pitch velocity.

[View Rows]
```

---

# 15. Pitcher Selection

TrackMan files may contain multiple pitchers.

If multiple pitchers are detected, prompt:

```text
SELECT A PITCHER

Tate Jones          37 pitches
John Smith          24 pitches
Michael Carter      18 pitches
```

Everything after that should be filtered to the selected pitcher.

---

# 16. Dashboard

The dashboard should provide a fast overview of the arsenal.

## Header Summary

Show:

- pitcher name
- throwing hand
- session
- number of pitches
- number of pitch types

## Arsenal Summary Table

Example:

| Pitch | Count | Velo | Max | IVB | HB | Spin | Extension |
|---|---:|---:|---:|---:|---:|---:|---:|
| FF | 18 | 93.1 | 94.7 | 17.2 | 8.4 | 2360 | 6.4 |
| SL | 11 | 84.8 | 86.1 | 3.4 | -7.9 | 2450 | 6.2 |
| CH | 8 | 85.9 | 87.0 | 9.2 | 14.8 | 1810 | 6.3 |

Use pitch colors as a small mark next to the pitch type.

## Dashboard Cards

Good overview cards:

- Avg Fastball Velocity
- Max Velocity
- Fastball IVB
- Fastball HB
- Release Height
- Extension
- Release Consistency
- Total Pitch Count

Do not overwhelm the dashboard with every metric.

---

# 17. Metric Education System

Every metric should have an educational layer.

When a user clicks an info icon, metric label, or chart annotation, show:

1. plain-English definition
2. units
3. what higher/lower means
4. why a pitcher should care
5. a visual explanation

Example:

## Induced Vertical Break

```text
INDUCED VERTICAL BREAK (IVB)

How much the pitch resists gravity because of its spin.

A pitch with +18" IVB does not literally rise 18 inches.
Instead, it drops roughly 18 inches less than a spinless /
gravity-only reference trajectory would.

WHY IT MATTERS

More IVB can help a fastball play above barrels, especially
when paired with velocity, release characteristics, and a
steep separation from breaking pitches.
```

Do not present generic "good/bad" judgments solely from one metric.

---

# 18. Learn Page

Create an educational glossary covering:

- Velocity
- Spin Rate
- Spin Axis
- Spin Direction
- Spin Efficiency
- Active Spin
- Induced Vertical Break
- Horizontal Break
- Release Height
- Release Side
- Extension
- Vertical Release Angle
- Horizontal Release Angle
- Vertical Approach Angle
- Horizontal Approach Angle
- Plate Location
- Seam-Shifted Wake, when data exists
- Gyro degree, when data exists
- Pitch tunneling

Each metric should include a small illustration.

---

# 19. Movement Page

This is one of the most important pages.

## Movement Plot

Create the standard movement profile scatter plot:

- X axis = Horizontal Break
- Y axis = Induced Vertical Break
- one dot per pitch
- colored by pitch type
- optional average point for each pitch type
- optional ellipse / confidence region around each pitch cluster

Controls:

```text
[Individual Pitches]
[Pitch Averages]
[Both]

Pitch Type: [All ▼]
Session:    [Current ▼]
```

Use a true equal-ish visual scale where practical so movement differences are not visually distorted.

Include:

- zero lines
- quadrant guides
- hover tooltips
- pitch count
- average movement labels

Tooltip example:

```text
SLIDER
Pitch #24

84.7 mph
IVB: 2.8"
HB: -8.4"
Spin: 2,510 rpm
```

---

# 20. Movement Separation

Calculate pitch-shape separation.

For two pitch types:

```ts
movementSeparation =
  sqrt(
    (avgHB_A - avgHB_B) ** 2 +
    (avgIVB_A - avgIVB_B) ** 2
  );
```

Display in inches.

Example:

```text
FASTBALL ↔ SLIDER
21.4" average movement separation
```

Clarify that this is a simple two-dimensional movement-distance metric and is not a complete measure of pitch quality or tunneling.

---

# 21. Release Page

Create release-point visualizations.

## Release Point Scatter

View from catcher perspective:

- X = release side
- Y = release height
- point = pitch
- color = pitch type

Show the average for each pitch.

Add:

- one-standard-deviation ellipse or spread
- median release point
- release spread

Goal:

Make it easy to see whether every pitch appears to come from the same release window.

## Release Consistency

For each pitch type calculate:

- standard deviation release height
- standard deviation release side
- combined release spread

Possible combined metric:

```ts
releaseSpread = sqrt(
  stdDev(releaseSide) ** 2 +
  stdDev(releaseHeight) ** 2
);
```

Do not call it an industry-standard score unless it actually is one.

Call it something like:

```text
Release Spread
```

and explain the formula.

---

# 22. Location Page

Create catcher-view strike-zone plots.

Axes:

- X = plate side
- Y = plate height

Display:

- home plate / strike zone
- each pitch location
- pitch color
- filters

Views:

- all pitches
- selected pitch type
- called strikes if result data is available
- swings
- whiffs
- balls in play

Do not make outcome fields mandatory.

---

# 23. Spin Page

Visualize:

- spin rate by pitch
- spin efficiency by pitch
- spin axis / tilt if available
- active spin if available
- gyro degree if available
- SSW measurements if available

Useful charts:

1. Spin Rate vs Velocity
2. Spin Rate distribution
3. Spin Efficiency by Pitch Type
4. Spin direction clock graphic
5. Spin Axis vs Movement

Create a clock-face spin direction illustration when data supports it.

---

# 24. Session Comparison

Users should be able to upload more than one session.

Comparison examples:

```text
AUG 30 BULLPEN
vs
SEP 14 BULLPEN
```

Show changes in:

- average velocity
- max velocity
- IVB
- HB
- spin rate
- extension
- release height
- release side
- release spread
- pitch usage

Use delta notation:

```text
Fastball Velo
92.4 → 93.1
+0.7 mph
```

Do not automatically characterize every change as improvement or decline.

---

# 25. Pitch Tunneling — Core Feature

This feature is the signature visualization.

The user should be able to select two or more pitch types and see their trajectories drawn from release toward home plate.

Example:

```text
PITCH TUNNEL

[FF ✓] [SL ✓] [CH]
View: Catcher | Side | Top | 3D
Mode: Average Path | Individual Pitches
```

Each path must use the centralized pitch-type color.

---

# 26. Tunneling Visualization Goals

The visualization should make these concepts obvious:

1. release point
2. initial direction
3. shared early flight
4. point where paths noticeably separate
5. final plate location
6. vertical separation
7. horizontal separation

Important:

Do **not** merely draw arbitrary Bezier curves that look realistic.

Use real trajectory data when available.

---

# 27. TrackMan Trajectory Reconstruction

When a TrackMan data file contains the nine-parameter trajectory values:

```text
x0
y0
z0

vx0
vy0
vz0

ax0
ay0
az0
```

reconstruct the pitch path with classical constant-acceleration equations.

For time `t`:

```ts
x(t) = x0 + vx0*t + 0.5*ax0*t*t
y(t) = y0 + vy0*t + 0.5*ay0*t*t
z(t) = z0 + vz0*t + 0.5*az0*t*t
```

Sample the path at many points.

Recommended:

```ts
const SAMPLE_COUNT = 100;
```

The path should begin at or near the tracked release point and end near the plate plane.

Do not use a fixed end time if it can be calculated.

Solve for the time when the pitch reaches the desired y-plane.

---

# 28. Solve for Plate Crossing

Given:

```ts
y(t) = y0 + vy0*t + 0.5*ay0*t²
```

solve:

```text
y(t) = yTarget
```

For a home-plate reference plane:

```text
0.5*ay0*t² + vy0*t + (y0 - yTarget) = 0
```

Choose the physically valid positive root.

Create helper:

```text
src/features/trajectory/solveFlightTime.ts
```

Then sample:

```ts
t = flightTime * i / (sampleCount - 1)
```

---

# 29. Trajectory Coordinate Layer

Do not let vendor coordinates leak directly into rendering components.

Create a transformation layer:

```text
raw vendor coordinates
        ↓
canonical baseball coordinates
        ↓
view coordinates
        ↓
screen / Three.js coordinates
```

Define the convention in code comments.

Example canonical coordinate system:

```text
x = horizontal / arm-side–glove-side dimension
y = distance from home plate toward mound
z = height
```

The display should provide:

- catcher view
- pitcher view
- side view
- top view
- interactive 3D

Make sure handedness and sign conventions are correctly handled.

Do not simply invert numbers until the plot "looks right."

---

# 30. Average Pitch Trajectory

Individual pitches are useful but can create visual clutter.

Create an **Average Path** mode.

For a pitch type:

Option A:
- calculate trajectories for every pitch
- resample each pitch onto normalized flight progress
- average x/y/z values at each normalized step

This is preferred.

Do not average raw `x0`, `v0`, and `a0` unless the math has been validated for the intended visualization.

Output:

```ts
type PathPoint = {
  x: number;
  y: number;
  z: number;
  progress: number;
};
```

---

# 31. Rapsodo / Missing Trajectory Data

Some imported datasets may not contain the full nine-parameter model.

Do not pretend an estimated line is measured.

Use two modes:

## Measured / Reconstructed Trajectory

Badge:

```text
TRAJECTORY: TRACKED
```

Use when enough trajectory parameters are present.

## Estimated / Illustrative Trajectory

Badge:

```text
TRAJECTORY: ESTIMATED
```

If the available data only includes values such as:

- release height
- release side
- horizontal break
- vertical break
- release angles
- plate location

construct an approximate visual path only if it can be done defensibly.

The UI must explain:

```text
This path is an approximation based on the available release,
movement, and location measurements. It is intended to illustrate
pitch shape and is not the original measured ball-flight trajectory.
```

If there is not enough data for a meaningful estimate, do not create a fake trajectory.

Instead show:

```text
This file does not contain enough trajectory information for
the pitch-flight view.
```

Then still allow movement/release charts.

---

# 32. Tunneling Comparison

The user should be able to compare:

- FF vs SL
- FF vs CH
- FF vs CU
- SI vs SL
- any combination

UI:

```text
COMPARE PITCHES

Primary:
[Four-Seam ▼]

Secondary:
[Slider ▼]

[+ Add Pitch]
```

---

# 33. Tunnel Point Concept

Create an understandable, explicitly defined visual metric for when two average pitch paths meaningfully separate.

Do not imply it is an established professional metric unless using a documented methodology.

Possible app-specific metric:

## Separation by Distance from Plate

At each sampled point, calculate:

```ts
distance = sqrt(
  (xA - xB) ** 2 +
  (zA - zB) ** 2
);
```

This measures visible lateral/vertical separation at the same downrange point.

Show charts such as:

```text
SEPARATION

50 ft   0.7"
40 ft   1.3"
30 ft   2.6"
20 ft   5.8"
10 ft   10.2"
Plate   15.4"
```

Allow a configurable visual threshold such as:

```text
2"
3"
4"
```

Then say:

```text
Paths first exceed 3" of separation at approximately 28 ft
from home plate.
```

Call this:

```text
3" Separation Point
```

rather than inventing an authoritative "tunnel score."

---

# 34. Flight Progress Scrubber

A particularly useful interaction:

```text
RELEASE ─────────●──────────── PLATE
                 62%
```

As the user drags the slider:

- animate a baseball marker along each trajectory
- show current path separation
- show distance remaining to home plate
- update catcher/side/top views

This will make tunneling easier to understand.

---

# 35. Tunneling Camera Views

## Catcher View

Best for:

- release window
- horizontal/vertical separation
- final pitch location

## Side View

Best for:

- vertical trajectory
- extension
- vertical approach
- curveball depth

## Top View

Best for:

- glove-side/arm-side movement
- sweep
- changeup/sinker run

## 3D View

Interactive:

- orbit
- zoom
- pan
- reset camera

Provide preset camera buttons so the user does not have to manually position the camera.

---

# 36. Baseball Field Geometry

For the 3D view include minimalist reference geometry:

- mound / rubber indicator
- home plate
- strike zone
- release point
- distance markers

Keep this Swiss/minimal.

Do not build a video-game stadium.

Use thin lines and subtle neutral colors.

---

# 37. Pitch Path Rendering

Recommended Three.js structure:

```text
<TunnelScene>
  <ReferenceField />
  <StrikeZone />
  <ReleaseMarker />

  <PitchPath pitch="FF" />
  <PitchPath pitch="SL" />

  <FlightMarker />
</TunnelScene>
```

Paths can be rendered as:

- `THREE.Line`
- tube geometry for thicker paths
- Drei `<Line />`

Use smooth interpolation between calculated points only for rendering.

Do not alter actual trajectory coordinates merely to create prettier curves.

---

# 38. Individual vs Average Paths

Support:

```text
AVERAGE
INDIVIDUAL
```

## Average

- one bold path per pitch type
- easy comparison
- default mode

## Individual

- every pitch path
- low opacity
- average path layered on top
- useful for consistency analysis

This makes it possible to see both tunnel quality and repeatability.

---

# 39. Release Window Visualization

At the release plane:

- draw a small circle/ellipse representing release cluster
- show each pitch type
- overlay average release point

Possible text:

```text
FF ↔ SL release separation
1.7 inches
```

This can be an important companion to path separation.

---

# 40. Plate Separation

At the plate plane, show:

```text
FF vs SL

Horizontal separation: 8.2"
Vertical separation:   12.7"
Total separation:      15.1"
```

Total:

```ts
Math.sqrt(horizontal ** 2 + vertical ** 2)
```

Clearly distinguish:

- movement separation
- trajectory separation
- plate-location separation

These are not always the same thing.

---

# 41. Arsenal Page

Create a page that treats each pitch as a profile.

Example cards:

```text
FOUR-SEAM FASTBALL
93.1 mph

17.2" IVB
8.4" HB
2360 rpm
98% spin efficiency
6.4 ft extension
```

Clicking a pitch opens:

- velocity distribution
- movement cluster
- release cluster
- spin characteristics
- location
- session trend
- comparisons to another pitch

---

# 42. Pitch Detail Page

Route example:

```text
/pitches/ff
```

Sections:

1. Overview
2. Velocity
3. Movement
4. Spin
5. Release
6. Location
7. Consistency
8. Tunnel Pairings

---

# 43. Data Filters

Global filters should include:

- session
- pitcher
- pitch type
- batter side if present
- date
- bullpen/game
- velocity range
- pitch result if present

Filters must be reflected across all charts.

---

# 44. Statistical Helpers

Create reusable helpers.

```text
src/utils/stats/
  mean.ts
  median.ts
  standardDeviation.ts
  percentile.ts
  minMax.ts
  euclideanDistance.ts
```

Do not duplicate calculations inside React components.

---

# 45. Derived Metrics

Safe derived metrics include:

## Velocity Differential

```text
Fastball Avg Velo - Secondary Pitch Avg Velo
```

## Movement Separation

```text
sqrt(ΔHB² + ΔIVB²)
```

## Release Separation

Convert release side/height to the same unit, preferably inches:

```text
sqrt(ΔReleaseSide² + ΔReleaseHeight²)
```

## Plate Separation

```text
sqrt(ΔPlateSide² + ΔPlateHeight²)
```

## Consistency

Use standard deviation and state exactly what is being measured.

Do not create opaque "Stuff+" style grades without a validated model.

---

# 46. Avoid Fake Analytics

This app must distinguish:

1. measured metrics
2. mathematically derived metrics
3. estimates
4. educational interpretation

Never display a proprietary-looking score unless the formula is explicit.

Bad:

```text
Tunnel Score: 92
```

unless there is a validated model behind it.

Better:

```text
3" Separation Point
28.4 ft from home plate
```

with a tooltip explaining the exact calculation.

---

# 47. Chart Interaction Standards

Every chart should support appropriate combinations of:

- hover tooltip
- pitch type toggle
- legend
- reset zoom
- highlight average
- show/hide individual pitches
- comparison mode

Do not overload charts with unnecessary controls.

---

# 48. Tooltips

Use concise Swiss-style tooltips.

Example:

```text
FOUR-SEAM
Pitch 17

Velo       93.6 mph
IVB        18.1 in
HB          7.9 in
Spin       2,412 rpm
```

Values should align vertically.

---

# 49. Explanation Drawer

Clicking a metric label can open a right-side educational drawer.

Example:

```text
WHAT IS RELEASE SIDE?

Release side measures how far left/right of the center of the
rubber the ball is released.

WHY IT MATTERS

Comparing release side across pitch types helps show whether
different pitches come out of a similar release window.

[See on diagram]
```

The diagram should highlight the measurement visually.

---

# 50. Illustrations

Create simple SVG educational illustrations.

Examples:

## Extension

Side-view mound:

```text
rubber ----------------------------- plate
        pitcher
             ● release
             <---- extension ---->
```

## Release Height

Vertical line from ground to release point.

## Release Side

Top/catcher view showing offset from center of rubber.

## Horizontal Break

Top view showing gravity/reference path vs actual horizontal deviation.

## IVB

Side view comparing:

- gravity-only reference
- actual pitch path

## Approach Angle

Show the angle at which the ball enters the plate plane.

Keep illustrations schematic rather than photorealistic.

---

# 51. Terminology Guardrails

Movement terminology differs by source.

Never assume:

```text
Vertical Break
```

means exactly the same thing in every export.

Internally distinguish:

```ts
verticalBreak
inducedVerticalBreak
```

Keep source-specific aliases documented.

If an imported column is ambiguous, ask the user to map it.

---

# 52. Pitch Type Normalization

Raw data may contain:

```text
Four-Seam
Four-Seam Fastball
4-Seam
FF
Fastball
```

Normalize to a pitch enum.

Example:

```ts
type PitchType =
  | "FF"
  | "SI"
  | "FC"
  | "SL"
  | "ST"
  | "CU"
  | "KC"
  | "CH"
  | "FS"
  | "OTHER";
```

Maintain:

```text
raw value
normalized value
display name
color
```

Allow the user to correct misclassified pitches.

---

# 53. User Pitch-Type Editor

After upload:

```text
WE IDENTIFIED

FF   Four-Seam Fastball     18
SL   Slider                 11
CH   Changeup                8
UN   Unknown                 3

[Edit Pitch Types]
```

A pitcher should be able to say:

```text
"SL" in this file is actually my sweeper.
```

Charts must update immediately.

---

# 54. Handling Handedness

Pitch movement visualization changes interpretation based on pitcher handedness.

Store pitcher hand.

Use it to provide optional labels:

```text
ARM SIDE
GLOVE SIDE
```

instead of assuming left/right always means the same baseball concept.

On raw measurement views, also preserve actual sign convention.

Include a small orientation key.

---

# 55. Responsive Behavior

Desktop is primary.

Mobile should still support:

- upload
- arsenal summary
- movement plots
- metric education
- basic tunnel views

Complex 3D tunneling can use a simplified mobile layout.

Charts should never become unreadably compressed.

Allow horizontal chart expansion or full-screen mode.

---

# 56. Accessibility

Requirements:

- keyboard-accessible controls
- sufficient contrast
- pitch type should not be distinguishable by color alone
- use labels/shapes/abbreviations with color
- accessible chart descriptions
- visible focus states
- reduced motion support

---

# 57. Suggested Folder Structure

```text
src/
  app/
    App.tsx
    router.tsx

  components/
    layout/
    ui/
    charts/
    baseball/

  features/
    upload/
      UploadPage.tsx
      ImportSummary.tsx
      ColumnMapper.tsx

    dashboard/
    arsenal/
    movement/
    release/
    tunneling/
      TunnelPage.tsx
      TunnelScene.tsx
      PitchPath.tsx
      StrikeZone3D.tsx
      ReleasePlane.tsx
      FlightScrubber.tsx
      trajectoryMath.ts
      averageTrajectory.ts
      separation.ts

    location/
    spin/
    sessions/
    education/

  data/
    adapters/
      trackmanAdapter.ts
      rapsodoAdapter.ts
      genericAdapter.ts

    detectVendor.ts
    normalizePitch.ts
    columnAliases.ts
    pitchTypes.ts

  hooks/

  models/
    pitch.ts
    session.ts

  utils/
    stats/
    units.ts
    formatters.ts

  styles/
    tokens.css
    globals.css
```

---

# 58. Component Standards

Components should be small and focused.

Avoid giant pages containing parsing, calculations, chart configuration, and UI all in one file.

Example:

Bad:

```text
TunnelPage.tsx
1200 lines
```

Better:

```text
TunnelPage
TunnelControls
TunnelScene
PitchPath
PathLegend
SeparationReadout
FlightScrubber
TunnelEducation
```

---

# 59. State Management

Separate:

- raw imported file
- normalized pitch data
- session metadata
- selected pitcher
- global filters
- chart UI state
- user preferences

Do not mutate original data.

Consider:

```ts
type AppState = {
  sessions: Session[];
  activeSessionId: string | null;
  activePitcherId: string | null;
  filters: PitchFilters;
};
```

Derived chart data should usually come from selectors/hooks.

---

# 60. Performance

Pitch files may contain thousands of rows.

Requirements:

- parse files efficiently
- memoize expensive filtering
- avoid rerendering Three.js scenes unnecessarily
- calculate trajectory points once per pitch unless data changes
- use Web Workers later if imports become large

For individual trajectory mode, consider limiting rendered paths or sampling if the dataset is enormous.

---

# 61. Data Privacy

Pitch data can be sensitive team/player information.

For an MVP, local-only processing is a strong feature.

Display:

```text
YOUR DATA STAYS IN YOUR BROWSER

Files are processed locally and are not uploaded to a server.
```

Only claim this if the implementation actually works that way.

If a backend is later added, update the privacy language.

---

# 62. Empty States

Examples:

## No File

```text
YOUR PITCH DATA, EXPLAINED.

Upload a TrackMan or Rapsodo export to visualize your arsenal.

[Upload Data]
```

## Missing Spin

```text
SPIN DATA NOT AVAILABLE

This export does not contain spin metrics.
Movement and release visualizations are still available.
```

## Missing Trajectory

```text
FLIGHT PATH UNAVAILABLE

The current file does not include enough information to
reconstruct the pitch trajectory.
```

---

# 63. Demo Dataset

Include a demo mode so Codex can build and test the interface without requiring a real private TrackMan file.

Create synthetic data that looks plausible but is explicitly fictional.

Example button:

```text
[Explore Demo Pitcher]
```

Demo arsenal:

- Four-Seam
- Slider
- Changeup
- Curveball

Include trajectory parameters so the tunneling page can be tested.

Never present demo values as real player data.

---

# 64. Test Data Generator

Create:

```text
src/data/demo/generateDemoSession.ts
```

The generator should support:

- pitch count
- pitch type
- average velocity
- velocity spread
- IVB/HB distribution
- release distribution
- plate-location distribution
- trajectory parameter variation

This will make UI development easier.

---

# 65. Testing Requirements

Use:

- Vitest
- React Testing Library

Critical unit tests:

1. CSV column matching
2. TrackMan normalization
3. Rapsodo normalization
4. pitch-type normalization
5. unit conversions
6. trajectory equation calculations
7. plate-crossing time solver
8. movement separation
9. release separation
10. average trajectory generation

Trajectory math needs tests because a visually plausible chart can still be mathematically wrong.

---

# 66. Trajectory Sanity Tests

For every reconstructed trajectory:

- flight time must be positive
- trajectory must move toward the plate
- height should remain physically plausible
- plate crossing should be near the expected plane
- start point should align with release values
- calculated final point should be reasonably consistent with plate location when both exist

If the values fail validation:

```text
Trajectory data appears inconsistent.
```

Do not render misleading paths.

---

# 67. Development Stages

## Phase 1 — Foundation

Build:

- React/Vite/TypeScript setup
- Swiss design system
- navigation
- file uploader
- CSV parsing
- canonical pitch model
- TrackMan adapter
- generic column mapper
- demo data

Definition of done:

A user can upload a CSV and see normalized pitches.

---

## Phase 2 — Core Pitch Dashboard

Build:

- pitcher selector
- arsenal table
- dashboard cards
- pitch filters
- movement plot
- release plot
- location plot

Definition of done:

A pitcher can understand the basic shape and release profile of the arsenal.

---

## Phase 3 — Education

Build:

- glossary
- metric explanations
- SVG metric illustrations
- explanation drawers
- contextual tooltips

Definition of done:

A user can click unfamiliar metrics and understand what they represent.

---

## Phase 4 — Tunneling MVP

Build:

- trajectory calculation
- average trajectory
- catcher view
- side view
- top view
- colored pitch paths
- pitch selectors
- separation readout

Definition of done:

A pitcher can visually compare two pitch paths from release to plate.

---

## Phase 5 — Advanced Tunneling

Build:

- 3D viewer
- flight scrubber
- individual pitch paths
- path separation vs distance graph
- threshold separation point
- release separation
- plate separation

Definition of done:

The tunneling feature becomes the signature interactive tool.

---

## Phase 6 — Session Comparison

Build:

- multiple sessions
- session picker
- metric changes
- comparison plots
- trends

Definition of done:

A pitcher can compare bullpens or outings over time.

---

## Phase 7 — Rapsodo Hardening

Build:

- additional Rapsodo mappings
- user mapping presets
- estimated trajectory mode where defensible
- vendor-specific warnings

Definition of done:

Rapsodo files with differing schemas can still be imported without breaking the app.

---

# 68. MVP Scope

The true MVP should include:

- CSV upload
- pitcher selection
- TrackMan normalization
- pitch-type normalization
- arsenal dashboard
- movement chart
- release chart
- location chart
- metric explanations
- TrackMan trajectory reconstruction
- basic pitch tunneling visualization
- pitch-type color system
- demo dataset

Do not delay the MVP by building:

- authentication
- subscriptions
- coach organizations
- AI scouting
- public profiles
- social features
- video synchronization
- mobile app
- complex backend infrastructure

Those can come later.

---

# 69. Future Features

Possible later additions:

## AI Pitch Data Assistant

User asks:

```text
Why does my slider look different this week?
```

The system can summarize changes based only on imported data.

Guardrail:

The AI should cite the metrics it used and avoid presenting medical/mechanical claims as certainty.

## Pitch Design Recommendations

Potentially show:

- movement gaps
- velocity gaps
- release similarities
- pitch-pair comparisons

Do not generate authoritative pitch-design recommendations without appropriate validation.

## Video Sync

Allow a pitch trajectory/data row to be paired with video.

## Team Accounts

- coach roster
- player accounts
- shared sessions
- reports
- comments

## PDF Reports

Generate printable pitcher reports.

## Benchmarks

Allow comparison to:

- user's own historical baseline
- team baseline
- conference baseline
- user-provided target values

Avoid presenting unverifiable "college average" benchmarks.

---

# 70. UX Copy Tone

The copy should be:

- direct
- athlete-friendly
- intelligent
- concise
- not overly scientific

Bad:

```text
The orthogonal vector displacement represents...
```

Better:

```text
This shows how far the pitch moves horizontally compared with
its reference flight path.
```

Use advanced detail in expandable sections.

---

# 71. Home / Landing Page

Suggested structure:

## Hero

```text
UNDERSTAND YOUR PITCHES.

Turn TrackMan and Rapsodo data into movement maps,
release profiles, and pitch-flight visualizations.

[Upload Pitch Data]
[Explore Demo]
```

## Three Main Value Props

```text
01
SEE YOUR ARSENAL

Understand velocity, movement, spin, release, and location.

02
SEE THE FLIGHT

Visualize how each pitch travels from release to the plate.

03
SEE THE TUNNEL

Compare pitch paths and identify where they begin to separate.
```

Keep it visually restrained.

---

# 72. Dashboard Visual Hierarchy

Example desktop composition:

```text
┌─────────────────────────────────────────────────────────────┐
│ TATE JONES                               SEP 14 BULLPEN     │
│ 42 PITCHES · RHP · TRACKMAN                                │
├─────────────────────────────────────────────────────────────┤
│ 93.1 MPH        17.2" IVB       2360 RPM       6.4 FT      │
│ FASTBALL        FASTBALL         FASTBALL       EXTENSION   │
├───────────────────────────────┬─────────────────────────────┤
│                               │                             │
│ MOVEMENT PROFILE              │ RELEASE PROFILE             │
│                               │                             │
│       scatter                 │       scatter               │
│                               │                             │
├───────────────────────────────┴─────────────────────────────┤
│ ARSENAL                                                     │
│ FF  SL  CH  CU                                               │
└─────────────────────────────────────────────────────────────┘
```

Use thin grid rules instead of floating rounded cards everywhere.

---

# 73. Tunneling Page Layout

Suggested desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ PITCH TUNNEL                                                 │
│ FF vs SL                                     TRACKED PATH    │
├────────────────────────────────────────┬─────────────────────┤
│                                        │ FOUR-SEAM           │
│                                        │ 93.1 mph            │
│           3D / 2D VIEWER               │ 17.2 IVB            │
│                                        │                     │
│                                        │ SLIDER              │
│                                        │ 84.8 mph            │
│                                        │ -7.9 HB             │
├────────────────────────────────────────┴─────────────────────┤
│ RELEASE ──────────────●────────────────────────────── PLATE   │
│                                                              │
│ Separation now: 2.7"      Distance to plate: 28.0 ft         │
├──────────────────────────────────────────────────────────────┤
│ SEPARATION BY DISTANCE                                       │
│ line chart                                                   │
└──────────────────────────────────────────────────────────────┘
```

---

# 74. Important Baseball Visualization Orientation

Every baseball chart must clearly say what perspective the user is looking from.

Examples:

```text
CATCHER VIEW
```

```text
PITCHER VIEW
```

```text
TOP VIEW
```

Pitch movement charts can be confusing when orientation is unclear.

Include:

```text
← GLOVE SIDE        ARM SIDE →
```

when appropriate and when throwing hand is known.

---

# 75. Calculations Documentation

Create a page or developer markdown document:

```text
docs/CALCULATIONS.md
```

Document every derived formula.

Include:

- movement separation
- release separation
- plate separation
- trajectory equations
- flight-time solution
- trajectory averaging
- separation threshold
- unit conversions

Goal:

No hidden math.

---

# 76. Vendor Documentation Notes

Do not assume every TrackMan or Rapsodo export will contain identical fields.

TrackMan data may expose detailed release, movement, location, and nine-parameter trajectory information.

Rapsodo commonly exposes pitching metrics such as velocity, spin, movement, release measurements, and related pitch-shape metrics, but export availability/schema may depend on product and account level.

Build the importer around capability detection:

```ts
const capabilities = {
  hasVelocity: true,
  hasMovement: true,
  hasRelease: true,
  hasPlateLocation: true,
  hasSpin: true,
  hasNineParameterTrajectory: false
};
```

Render features based on capabilities.

---

# 77. Capability-Driven Interface

Example:

```ts
if (capabilities.hasNineParameterTrajectory) {
  showTrackedTunnelVisualizer();
} else if (canEstimateTrajectory(data)) {
  showEstimatedTunnelVisualizer();
} else {
  showTrajectoryUnavailableState();
}
```

Likewise:

```ts
if (!capabilities.hasSpin) {
  hideSpinTabOrShowUnavailableState();
}
```

Do not allow missing data to crash the dashboard.

---

# 78. Code Quality Requirements for Codex

While implementing:

- use TypeScript strictly
- avoid `any` unless absolutely necessary
- add comments around baseball coordinate transformations
- keep formulas out of UI components
- create reusable chart primitives
- centralize pitch metadata
- centralize formatters
- validate imports
- handle missing values explicitly
- write tests before/alongside trajectory math
- do not fabricate unsupported metrics
- do not hard-code one user's name/data
- do not assume every pitcher is right-handed
- do not assume all files are TrackMan

---

# 79. Error Handling

Use friendly errors.

Bad:

```text
TypeError: undefined is not iterable
```

Good:

```text
WE COULDN'T READ THIS FILE

The file opened successfully, but we could not identify a
pitch-type column.

[Map Columns Manually]
```

---

# 80. Example Pitch Data Capability Matrix

| Feature | Minimum Data |
|---|---|
| Arsenal summary | Pitch type + velocity |
| Velocity charts | Pitch type + velocity |
| Movement plot | HB + IVB |
| Release plot | Release side + release height |
| Location plot | Plate side + plate height |
| Spin page | Spin rate and/or spin metrics |
| Tracked tunnel | Nine-parameter trajectory values |
| Estimated tunnel | Sufficient release + movement + location data |
| Session comparison | Two normalized sessions |

Use this matrix in application logic.

---

# 81. Export / Sharing Later

Possible feature:

```text
EXPORT REPORT
```

Could produce:

- PNG chart
- PDF pitcher report
- shareable image

Do not include in MVP unless core visualization work is complete.

---

# 82. Definition of Success

The project is successful when a college pitcher can:

1. upload his TrackMan or Rapsodo data
2. identify his pitch arsenal
3. immediately understand velocity, movement, release, spin, and location
4. click unfamiliar metrics and see what they physically mean
5. compare pitches visually
6. see how two pitches travel together early in flight
7. identify where those pitches begin to separate
8. compare sessions without opening a spreadsheet

The product should feel less like "analytics software" and more like an interactive pitching lab.

---

# 83. First Codex Implementation Prompt

Start by implementing only the foundation and first usable vertical slice.

Codex should:

1. Initialize a React + Vite + TypeScript project.
2. Create the Swiss International design system and main application shell.
3. Create the canonical pitch model.
4. Create pitch-type metadata/colors.
5. Implement CSV drag-and-drop with Papa Parse.
6. Implement vendor detection.
7. Implement a TrackMan adapter with alias-based column mapping.
8. Implement a generic/manual mapping fallback.
9. Add a fictional demo dataset.
10. Build the Dashboard.
11. Build the Movement Profile scatter plot.
12. Build the Release Point scatter plot.
13. Build the Location scatter plot.
14. Add metric explanation tooltips/drawers.
15. Add tests for normalization and calculations.

Do not start authentication or backend work.

After this works reliably, move to the tunneling implementation.

---

# 84. Second Codex Implementation Prompt — Tunneling

After the MVP dashboard is stable:

1. Add nine-parameter trajectory parsing.
2. Add trajectory validation.
3. Implement the constant-acceleration path calculations.
4. Solve for plate-crossing time.
5. Sample each trajectory into normalized path points.
6. Create average paths by pitch type.
7. Add catcher, side, and top 2D views.
8. Add colored FF/SL/etc. path lines.
9. Add pitch selectors.
10. Add release and plate markers.
11. Calculate pitch-path separation at equal downrange positions.
12. Add the separation-vs-distance chart.
13. Add a flight-progress scrubber.
14. Add individual-pitch mode.
15. Add Three.js 3D mode.
16. Clearly label tracked vs estimated trajectories.
17. Write unit tests for all trajectory math.

Accuracy is more important than visual flash.

---

# 85. Final Instruction to Codex

Treat this specification as the product source of truth.

When there is a conflict between:

- visual flair
- simplicity
- mathematical/data accuracy

choose **mathematical/data accuracy first**, then clarity, then visual flair.

The site must never make a pitch path or metric look more authoritative than the underlying data supports.

The defining qualities should be:

**CLEAR. VISUAL. ACCURATE. BASEBALL-FIRST.**
