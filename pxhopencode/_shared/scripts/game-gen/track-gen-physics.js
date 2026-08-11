#!/usr/bin/env node
/**
 * track-gen-physics.js — Black-box script
 * Sinh physics config cho game (cannon-es / arcade physics).
 * 
 * Usage:
 *   node track-gen-physics.js --genre racing --sub marble
 *   node track-gen-physics.js --genre platformer --sub 2d
 *   node track-gen-physics.js --help
 * 
 * Output: JSON to stdout (agent đọc, không đọc source).
 * Không server, không side-effect, deterministic.
 */

const args = process.argv.slice(2);
if (args.includes("--help") || args.length === 0) {
  console.log(JSON.stringify({
    usage: "node track-gen-physics.js --genre <genre> --sub <sub> [--quality high|medium|low]",
    genres: {
      racing: { subs: ["marble", "car", "kart", "motorcycle"] },
      platformer: { subs: ["2d", "3d"] },
      shooter: { subs: ["fps", "tps", "twin-stick", "bullet-hell"] },
      survival: { subs: ["open-world", "zombie", "craft"] },
      sports: { subs: ["football", "basketball", "golf"] },
      puzzle: { subs: ["physics", "logic"] },
    },
    output: "Physics config JSON — pipe hoặc redirect vào file",
  }, null, 2));
  process.exit(0);
}

const genre = parseArg("--genre");
const sub = parseArg("--sub");
const quality = parseArg("--quality") || "high";

const configs = {
  racing: {
    marble: {
      engine: "cannon-es",
      world: { gravity: [0, -9.82, 0], solverIterations: 10, allowSleep: true },
      ball: { mass: 1, radius: 0.5, linearDamping: 0.05, angularDamping: 0.1, maxSpeed: 15, forceMultiplier: 8 },
      materials: [
        { name: "ball", friction: 0.3, restitution: 0.2 },
        { name: "track", friction: 0.5, restitution: 0.05 },
        { name: "wall", friction: 0.2, restitution: 0.1 },
      ],
      contacts: [
        { a: "ball", b: "track", friction: 0.3, restitution: 0.2 },
        { a: "ball", b: "wall", friction: 0.2, restitution: 0.1 },
      ],
      qualityOverrides: {
        high: { solverIterations: 10, ccdEnabled: true },
        medium: { solverIterations: 5, ccdEnabled: false },
        low: { solverIterations: 3, ccdEnabled: false, ballRadius: 0.5 },
      },
      _notes: "CCD-enabled chong xuyen wall. Anti-bounce: lock Y vel khi on ground.",
    },
    car: {
      engine: "cannon-es",
      world: { gravity: [0, -9.82, 0], solverIterations: 15 },
      vehicle: {
        mass: 0.5, chassisSize: [0.5, 0.2, 1], wheelRadius: 0.15,
        maxSpeed: 30, steerAngle: 0.5, brakeForce: 10,
        suspensionStiffness: 20, damping: 2,
      },
      qualityOverrides: {
        high: { solverIterations: 15, suspensionStiffness: 25 },
        medium: { solverIterations: 10, suspensionStiffness: 20 },
        low: { solverIterations: 5, suspensionStiffness: 15 },
      },
    },
    kart: {
      engine: "cannon-es",
      world: { gravity: [0, -9.82, 0], solverIterations: 10 },
      vehicle: {
        mass: 0.4, chassisSize: [0.4, 0.15, 0.8], wheelRadius: 0.12,
        maxSpeed: 20, steerAngle: 0.7, brakeForce: 8, driftFactor: 0.3,
      },
    },
  },
  platformer: {
    "2d": {
      engine: "phaser-arcade",
      gravity: { x: 0, y: 800 },
      player: { jumpVelocity: -400, moveSpeed: 200, maxVelocity: { x: 300, y: 600 } },
      collision: { bounce: 0, drag: 0 },
    },
    "3d": {
      engine: "cannon-es",
      world: { gravity: [0, -20, 0], solverIterations: 5 },
      player: { mass: 1, jumpForce: 8, moveSpeed: 10, airControl: 0.3 },
    },
  },
  shooter: {
    fps: {
      engine: "cannon-es",
      player: { mass: 1, moveSpeed: 7, jumpForce: 5, aimSpeed: 0.002, fov: 75 },
      bullet: { mass: 0.01, speed: 50, lifetime: 2, poolSize: 50 },
    },
    "twin-stick": {
      engine: "phaser-arcade",
      player: { speed: 200, bulletSpeed: 400, fireRate: 150 },
      bullet: { poolSize: 100, lifetime: 2000 },
    },
    "bullet-hell": {
      engine: "phaser-arcade",
      player: { speed: 180, hitboxRadius: 3 },
      bullet: { poolSize: 500, defaultPattern: "spiral" },
    },
  },
  survival: {
    "open-world": {
      engine: "cannon-es",
      world: { gravity: [0, -9.82, 0] },
      player: { mass: 1, moveSpeed: 5, jumpForce: 5, stamina: 100 },
    },
  },
};

const genreConfig = configs[genre]?.[sub];
if (!genreConfig) {
  console.error(JSON.stringify({ error: `Unknown genre/sub: ${genre}/${sub}` }));
  process.exit(1);
}

const merged = { ...genreConfig };
if (genreConfig.qualityOverrides?.[quality]) {
  Object.assign(merged, genreConfig.qualityOverrides[quality]);
  delete merged.qualityOverrides;
}

console.log(JSON.stringify(merged, null, 2));
process.exit(0);

function parseArg(name) {
  const idx = args.indexOf(name);
  return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
}
