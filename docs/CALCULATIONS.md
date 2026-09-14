# Calculations and source conventions

All calculations run in the browser. Missing numbers are excluded from that metric’s mean; an empty sample displays a dash. No missing value is replaced by zero. Displayed counts include retained incomplete rows. Release spread uses only complete side/height pairs.

- Mean: sum / available count. Maximum: greatest available value.
- Movement separation: sqrt((mean HB A − mean HB B)² + (mean IVB A − mean IVB B)²), inches.
- Release spread: sqrt(population variance of release side + population variance of release height) × 12, inches. This is descriptive, not an industry-standard score.
- Path separation: sqrt((xA − xB)² + (zA − zB)²) × 12 at equal distance from home plate. Plate separation evaluates at y = 0.
- Position at time t: initial position + initial velocity × t + 0.5 × acceleration × t².
- Flight time: smallest positive root of 0.5 ay t² + vy t + y0 = 0. Near-zero acceleration uses −y0 / vy. Invalid roots and flight times over one second are rejected.
- Each path uses 101 samples. Linear interpolation resamples x/z at shared downrange y positions. Averages use the common start plane nearest the plate across included trajectories. They are not averages of raw coefficients.
- Trajectories must remain between 0 and 12 feet high, travel monotonically toward y = 0, and finish within one foot of recorded location if available. These are conservative sanity checks, not device certification. Incomplete/inconsistent paths are excluded with a count.
- Canonical coordinates: x is catcher-view right, y decreases from mound toward plate (0), z is up, all in feet. Positions, velocities, and accelerations must use the same reference frame. Import requires confirmation; no sign convention is guessed. Exports using a different plane/frame must be transformed before import. Some nine-parameter exports begin at a tracking plane rather than the physical release point.
- Imperial import: mph, rpm, inches of movement, feet of position, degrees, ft/s and ft/s². Metric option: km/h ÷ 1.609344; cm of movement ÷ 2.54; m of position, m/s and m/s² × 3.280839895. Angles/rpm/percent unchanged. Mixed-unit files require preprocessing.
- IVB and total vertical break are distinct. `VerticalBreak` is intentionally not treated as IVB.
- Location box is an illustrative 17-inch-wide zone, 1.5–3.5 feet high. It is not an individualized or umpire-calibrated strike zone.
- Demo data is deterministic, fictional, and includes synthetic constant-acceleration trajectories with consistent endpoints. It is not measured athlete data.

Current scope: no inferred trajectories without nine parameters, separation threshold score, outcome classifiers, or benchmarks. Imported sessions are held in memory; column mappings are saved locally when storage is available. Reloading resets session data to the demo.

## 3D world

Canonical `(x, y, z)` maps to Three.js `(-x, z, y)`. With the catcher camera looking toward positive world Z, this preserves catcher-right horizontal orientation. It preserves all distances and uses feet throughout. Paths are sampled from the existing validated trajectory calculations. The scrubber and animation advance a common distance plane; they do not synchronize by elapsed physical flight time. The standard pitching rubber is drawn at 60.5 feet. The pitcher is static illustrative scenery, independent of measured release mechanics; enlarged ball markers aid visibility.
