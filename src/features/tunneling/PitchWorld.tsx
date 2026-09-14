import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PITCH_META, type PitchType } from "../../models/pitch";
import { atDistance, type Point } from "../../utils/trajectory";
import { toWorld } from "./world";
export interface FlightPath {
  type: PitchType;
  points: Point[];
}
type CameraView =
  "Overview" | "Behind pitcher" | "Behind catcher" | "Side angle";
interface WorldHandle {
  balls: { mesh: THREE.Mesh; points: Point[] }[];
  plane: THREE.Group;
  camera: (view: CameraView) => void;
  render: () => void;
}
const cameras: CameraView[] = [
  "Overview",
  "Behind pitcher",
  "Behind catcher",
  "Side angle",
];
export default function PitchWorld({
  paths,
  ballPaths,
  distance,
  hand,
  onFallback,
}: {
  paths: FlightPath[];
  ballPaths: FlightPath[];
  distance: number;
  hand?: "R" | "L";
  onFallback: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<WorldHandle | null>(null);
  const currentDistance = useRef(distance);
  currentDistance.current = distance;
  const [camera, setCamera] = useState<CameraView>("Overview");
  const [error, setError] = useState(false);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    if (typeof WebGL2RenderingContext === "undefined") {
      setError(true);
      return;
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      setError(true);
      return;
    }
    setError(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor("#14231d");
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D pitcher and ball flight",
    );
    renderer.domElement.setAttribute("role", "img");
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#14231d", 95, 180);
    const camera3D = new THREE.PerspectiveCamera(43, 1, 0.1, 260);
    const controls = new OrbitControls(camera3D, renderer.domElement);
    controls.minDistance = 4;
    controls.maxDistance = 110;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.enableDamping = false;
    const render = () => renderer.render(scene, camera3D);
    controls.addEventListener("change", render);
    scene.add(new THREE.HemisphereLight("#e9f0df", "#5b5141", 2.4));
    const light = new THREE.DirectionalLight("#fff2d8", 3);
    light.position.set(-20, 45, 15);
    scene.add(light);
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const material = (color: string, roughness = 0.85) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness });
      materials.push(m);
      return m;
    };
    const grass = material("#294936"),
      dirt = material("#7d6750"),
      chalk = material("#dedecb"),
      uniform = material("#e7e8d9"),
      jersey = material("#365c50"),
      skin = material("#b88763"),
      shoe = material("#25322b"),
      glove = material("#5d3e2d");
    const mesh = (
      geometry: THREE.BufferGeometry,
      mat: THREE.Material,
      position: [number, number, number],
      parent: THREE.Object3D = scene,
    ) => {
      const m = new THREE.Mesh(geometry, mat);
      m.position.set(...position);
      parent.add(m);
      return m;
    };
    mesh(new THREE.PlaneGeometry(200, 200), grass, [0, -0.08, 30]).rotation.x =
      -Math.PI / 2;
    const lane = mesh(
      new THREE.PlaneGeometry(8, 60.5),
      material("#304e39"),
      [0, -0.065, 30.25],
    );
    lane.rotation.x = -Math.PI / 2;
    mesh(new THREE.CylinderGeometry(9, 10, 0.55, 64), dirt, [0, 0.15, 60.5]);
    mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.06, 64), dirt, [0, -0.035, 0]);
    mesh(new THREE.BoxGeometry(2, 0.08, 0.5), chalk, [0, 0.48, 60.5]);
    const plateShape = new THREE.Shape();
    plateShape.moveTo(-0.708, 0);
    plateShape.lineTo(0.708, 0);
    plateShape.lineTo(0.708, 0.708);
    plateShape.lineTo(0, 1.416);
    plateShape.lineTo(-0.708, 0.708);
    plateShape.closePath();
    const plate = mesh(
      new THREE.ShapeGeometry(plateShape),
      chalk,
      [0, 0.025, 0],
    );
    plate.rotation.x = -Math.PI / 2;
    const line = (points: THREE.Vector3[], color: string, opacity = 1) => {
      const m = new THREE.LineBasicMaterial({
        color,
        transparent: opacity < 1,
        opacity,
      });
      materials.push(m);
      const l = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        m,
      );
      scene.add(l);
      return l;
    };
    for (const x of [-2.5, 2.5])
      line(
        [
          new THREE.Vector3(x - 1, 0.035, -2),
          new THREE.Vector3(x + 1, 0.035, -2),
          new THREE.Vector3(x + 1, 0.035, 4),
          new THREE.Vector3(x - 1, 0.035, 4),
          new THREE.Vector3(x - 1, 0.035, -2),
        ],
        "#b9bca7",
        0.65,
      );
    for (const z of [10, 20, 30, 40, 50])
      line(
        [new THREE.Vector3(-5, 0.01, z), new THREE.Vector3(5, 0.01, z)],
        "#819784",
        0.3,
      );
    line(
      [
        new THREE.Vector3(-0.708, 1.5, 0),
        new THREE.Vector3(-0.708, 3.5, 0),
        new THREE.Vector3(0.708, 3.5, 0),
        new THREE.Vector3(0.708, 1.5, 0),
        new THREE.Vector3(-0.708, 1.5, 0),
      ],
      "#dfeac9",
      0.8,
    );
    for (const x of [-0.236, 0.236])
      line(
        [new THREE.Vector3(x, 1.5, 0), new THREE.Vector3(x, 3.5, 0)],
        "#dfeac9",
        0.2,
      );
    for (const h of [2.167, 2.833])
      line(
        [new THREE.Vector3(-0.708, h, 0), new THREE.Vector3(0.708, h, 0)],
        "#dfeac9",
        0.2,
      );
    const label = (text: string, pos: [number, number, number], width = 7) => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#c0ceb8";
      ctx.font = "500 23px Arial";
      ctx.textAlign = "center";
      ctx.fillText(text, 256, 40);
      const texture = new THREE.CanvasTexture(canvas);
      textures.push(texture);
      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      materials.push(mat);
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(...pos);
      sprite.scale.set(width, width / 8, 1);
      scene.add(sprite);
    };
    label("MOUND · 60′ 6″", [0, 1, 65], 10);
    label("HOME PLATE", [0, 0.5, -4], 8);
    for (const z of [10, 30, 50]) label(`${z} FT`, [-6, 0.4, z], 4);
    // A generic release-pose mannequin is contextual scenery, not inferred mechanics.
    const figure = new THREE.Group();
    scene.add(figure);
    figure.position.set(0, 0.5, 60.5);
    const sign = hand === "L" ? -1 : 1;
    const limb = (
      a: [number, number, number],
      b: [number, number, number],
      radius: number,
      mat: THREE.Material,
    ) => {
      const start = new THREE.Vector3(...a),
        end = new THREE.Vector3(...b),
        delta = end.clone().sub(start);
      const m = mesh(
        new THREE.CylinderGeometry(radius * 0.8, radius, delta.length(), 12),
        mat,
        start.clone().add(end).multiplyScalar(0.5).toArray() as [
          number,
          number,
          number,
        ],
        figure,
      );
      m.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        delta.normalize(),
      );
    };
    limb([-0.25, 2.7, -1.2], [-0.55, 1.45, -2.6], 0.23, uniform);
    limb([-0.55, 1.45, -2.6], [-0.7, 0.2, -3.9], 0.18, uniform);
    limb([0.25, 2.7, -1.2], [0.5, 1.45, -0.35], 0.24, uniform);
    limb([0.5, 1.45, -0.35], [0.2, 0.15, 0.2], 0.16, uniform);
    mesh(
      new THREE.BoxGeometry(0.45, 0.25, 0.85),
      shoe,
      [-0.7, 0.12, -4.1],
      figure,
    );
    mesh(
      new THREE.BoxGeometry(0.45, 0.25, 0.85),
      shoe,
      [0.2, 0.12, 0.1],
      figure,
    );
    limb([0, 2.6, -1.2], [0, 4.2, -2], 0.47, jersey);
    mesh(new THREE.SphereGeometry(0.36, 20, 16), skin, [0, 4.85, -2.2], figure);
    mesh(
      new THREE.SphereGeometry(0.38, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      jersey,
      [0, 4.94, -2.2],
      figure,
    );
    mesh(
      new THREE.BoxGeometry(0.65, 0.07, 0.38),
      jersey,
      [0, 4.94, -2.55],
      figure,
    );
    limb([sign * 0.4, 4.1, -2], [sign * 1, 4.6, -2.9], 0.16, jersey);
    limb([sign * 1, 4.6, -2.9], [sign * 1.65, 5.25, -4.3], 0.12, skin);
    mesh(
      new THREE.SphereGeometry(0.17, 12, 10),
      skin,
      [sign * 1.65, 5.25, -4.3],
      figure,
    );
    limb([-sign * 0.4, 4, -2], [-sign * 0.85, 3.5, -2.9], 0.18, jersey);
    limb([-sign * 0.85, 3.5, -2.9], [-sign * 0.25, 3.2, -3.4], 0.13, skin);
    mesh(
      new THREE.SphereGeometry(0.3, 14, 10),
      glove,
      [-sign * 0.25, 3.2, -3.4],
      figure,
    );
    paths.forEach((p) => {
      const pathMaterial = new LineMaterial({
        color: PITCH_META[p.type].color,
        linewidth: paths.length > 12 ? 1.2 : 2.5,
        transparent: true,
        opacity: paths.length > 12 ? 0.45 : 1,
      });
      materials.push(pathMaterial);
      const geometry = new LineGeometry();
      geometry.setPositions(p.points.flatMap(toWorld));
      scene.add(new Line2(geometry, pathMaterial));
      const end = toWorld(p.points[p.points.length - 1]);
      mesh(
        new THREE.SphereGeometry(0.085, 10, 8),
        material(PITCH_META[p.type].color),
        end,
      );
    });
    const balls = ballPaths.map((p) => ({
      points: p.points,
      mesh: mesh(
        new THREE.SphereGeometry(0.24, 20, 14),
        material(PITCH_META[p.type].color, 0.25),
        toWorld(atDistance(p.points, currentDistance.current) ?? p.points[0]),
      ),
    }));
    const plane = new THREE.Group();
    plane.position.z = currentDistance.current;
    scene.add(plane);
    const planeMat = new THREE.MeshBasicMaterial({
      color: "#d4e7bd",
      transparent: true,
      opacity: 0.035,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    materials.push(planeMat);
    mesh(new THREE.PlaneGeometry(7, 8), planeMat, [0, 4, 0], plane);
    const setCamera = (v: CameraView) => {
      if (v === "Behind pitcher") {
        camera3D.position.set(-3, 7, 72);
        controls.target.set(0, 2, 16);
      } else if (v === "Behind catcher") {
        camera3D.position.set(0, 4, -11);
        controls.target.set(0, 3, 38);
      } else if (v === "Side angle") {
        camera3D.position.set(49, 12, 27);
        controls.target.set(0, 2, 29);
      } else {
        camera3D.position.set(34, 25, -25);
        controls.target.set(0, 1.5, 29);
      }
      controls.update();
      render();
    };
    world.current = { balls, plane, camera: setCamera, render };
    setCamera(camera);
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      camera3D.aspect = width / height;
      camera3D.fov = THREE.MathUtils.radToDeg(
        2 *
          Math.atan(
            Math.tan(THREE.MathUtils.degToRad(43) / 2) *
              Math.max(1, 1.65 / camera3D.aspect),
          ),
      );
      materials.forEach((m) => {
        if (m instanceof LineMaterial) m.resolution.set(width, height);
      });
      camera3D.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const lost = (e: Event) => {
      e.preventDefault();
      setError(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      world.current = null;
      observer.disconnect();
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line)
          obj.geometry.dispose();
      });
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.dispose();
      renderer.domElement.remove();
    };
    // Camera changes are handled imperatively so scrubbing/orbiting never rebuilds the world.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, ballPaths, hand]);
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    w.balls.forEach(({ mesh, points }) => {
      const p = atDistance(points, distance);
      mesh.visible = !!p;
      if (p) mesh.position.set(...toWorld(p));
    });
    w.plane.position.z = distance;
    w.render();
  }, [distance]);
  return (
    <div className="pitch-world">
      <div className="world-toolbar">
        <div>
          <span className="world-dot" /> INTERACTIVE 3D
        </div>
        <div className="world-cameras">
          {cameras.map((v) => (
            <button
              key={v}
              aria-pressed={camera === v}
              onClick={() => {
                setCamera(v);
                world.current?.camera(v);
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div ref={host} className="world-canvas" />
      {error && (
        <div className="world-error">
          <h3>3D isn’t available in this browser.</h3>
          <p>
            Use a browser with WebGL enabled, or keep exploring the 2D paths.
          </p>
          <button onClick={onFallback}>Switch to 2D view</button>
        </div>
      )}
      <div className="world-bottom">
        <span>Drag to orbit · Scroll to zoom · Right-drag to pan</span>
        <span>
          Illustrative pitcher{hand ? ` · ${hand}HP` : ""} · Ball markers
          enlarged for visibility
        </span>
      </div>
    </div>
  );
}
