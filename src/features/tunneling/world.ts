import type { Point } from "../../utils/trajectory";
// A catcher camera looks along +world Z. Its screen-right is -world X.
// Reflect X so canonical catcher-right remains screen-right; feet stay feet.
export const toWorld = (point: Point): [number, number, number] => [
  -point.x,
  point.z,
  point.y,
];
