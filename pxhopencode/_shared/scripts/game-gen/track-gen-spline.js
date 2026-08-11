#!/usr/bin/env node
/**
 * track-gen-spline.js — Black-box script
 * Sinh spline control points + track segment data cho racing game.
 * 
 * Usage:
 *   node track-gen-spline.js --type oval --segments 200 --width 4
 *   node track-gen-spline.js --type figure8 --segments 300
 *   node track-gen-spline.js --type custom --points "0,0,0 20,0,0 40,5,10 30,10,30 0,5,30"
 *   node track-gen-spline.js --help
 * 
 * Output: JSON to stdout gồm controlPoints + segments + totalLength.
 * Không server, không side-effect, deterministic.
 */

const args = process.argv.slice(2);

if (args.includes("--help") || args.length === 0) {
  console.log(JSON.stringify({
    usage: "node track-gen-spline.js --type <oval|figure8|custom|loop|snake> [options]",
    options: {
      "--segments": "Number of track segments (default: 200)",
      "--width": "Track width (default: 4)",
      "--wall-height": "Wall height (default: 1.5)",
      "--points": "Custom control points: 'x,z x,z x,z...' (for --type custom)",
    },
    output: "JSON { controlPoints, segments[], totalLength, bounds }",
  }, null, 2));
  process.exit(0);
}

const type = parseArg("--type") || "oval";
const segments = parseInt(parseArg("--segments") || "200", 10);
const width = parseFloat(parseArg("--width") || "4");
const wallHeight = parseFloat(parseArg("--wall-height") || "1.5");

let controlPoints;
switch (type) {
  case "oval":
    controlPoints = [
      [0, 0, 0], [15, 0, 0], [30, 0, 0],
      [30, 0, -15], [30, 0, -30],
      [15, 0, -30], [0, 0, -30],
      [0, 0, -15], [0, 0, 0],
    ];
    break;
  case "figure8":
    controlPoints = [
      [0, 0, 0], [10, 1, 5], [20, 2, 0], [10, 1, -5],
      [0, 0, 0], [-10, 1, 5], [-20, 2, 0], [-10, 1, -5],
      [0, 0, 0],
    ];
    break;
  case "loop":
    controlPoints = [
      [0, 0, 0], [10, 0, 0], [20, 0, 0],
      [25, 5, 0], [20, 10, 0], [10, 10, 0],
      [0, 10, 0], [-5, 5, 0], [0, 0, 0],
    ];
    break;
  case "snake":
    controlPoints = [
      [0, 0, 0], [10, 0, 0], [20, 1, 5], [30, 0, 0],
      [40, 1, -5], [50, 0, 0], [60, 1, 5], [70, 0, 0],
      [80, 0, 0],
    ];
    break;
  case "custom": {
    const raw = parseArg("--points");
    if (!raw) { console.error(JSON.stringify({ error: "--points required for type=custom" })); process.exit(1); }
    controlPoints = raw.split(" ").map(p => {
      const [x, y, z] = p.split(",").map(Number);
      return [x, y || 0, z || 0];
    });
    break;
  }
  default:
    console.error(JSON.stringify({ error: `Unknown type: ${type}` }));
    process.exit(1);
}

// Generate segments along Catmull-Rom spline (simplified)
// Each segment: { position, tangent, normal, leftWall, rightWall }
const numPoints = controlPoints.length;
const totalLength = estimateLength(controlPoints);
const segs = [];

for (let i = 0; i < segments; i++) {
  const t = i / segments;
  const idx = t * (numPoints - 1);
  const i0 = Math.floor(idx) % numPoints;
  const i1 = (i0 + 1) % numPoints;
  const frac = idx - Math.floor(idx);

  // Linear interpolation between control points (đủ cho preview)
  const p0 = controlPoints[i0], p1 = controlPoints[i1];
  const pos = [
    p0[0] + (p1[0] - p0[0]) * frac,
    p0[1] + (p1[1] - p0[1]) * frac,
    p0[2] + (p1[2] - p0[2]) * frac,
  ];

  // Tangent
  const tangent = [
    p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2],
  ];
  const tLen = Math.sqrt(tangent[0]**2 + tangent[1]**2 + tangent[2]**2) || 1;

  // Normal (perpendicular to tangent in XZ plane)
  const normal = [-tangent[2] / tLen, 0, tangent[0] / tLen];
  const hw = width / 2;

  segs.push({
    index: i,
    t,
    position: pos,
    tangent: tangent.map(v => v / tLen),
    normal,
    leftWall: [pos[0] + normal[0] * (hw + 0.3), pos[1] + wallHeight / 2, pos[2] + normal[2] * (hw + 0.3)],
    rightWall: [pos[0] - normal[0] * (hw + 0.3), pos[1] + wallHeight / 2, pos[2] - normal[2] * (hw + 0.3)],
  });
}

// Checkpoints at 20%, 40%, 60%, 80%
const checkpoints = [0.2, 0.4, 0.6, 0.8].map(t => {
  const idx = Math.floor(t * segments);
  return segs[Math.min(idx, segs.length - 1)].position;
});

const out = {
  type,
  controlPoints,
  segments: segs,
  checkpoints,
  totalLength: Math.round(totalLength * 100) / 100,
  trackWidth: width,
  wallHeight,
  bounds: {
    minX: Math.min(...controlPoints.map(p => p[0])),
    maxX: Math.max(...controlPoints.map(p => p[0])),
    minZ: Math.min(...controlPoints.map(p => p[2])),
    maxZ: Math.max(...controlPoints.map(p => p[2])),
  },
  _help: "Dùng segments[] position cho CatmullRomCurve3. Checkpoints là trigger zone positions.",
};

console.log(JSON.stringify(out, null, 2));
process.exit(0);

function parseArg(name) {
  const idx = args.indexOf(name);
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
}

function estimateLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i-1][0];
    const dy = points[i][1] - points[i-1][1];
    const dz = points[i][2] - points[i-1][2];
    len += Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
  return len;
}
