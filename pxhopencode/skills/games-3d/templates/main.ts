import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Configurable scene palette — reference: _shared/design-system/design-tokens.css
// Use the CSS custom properties (--brand-*, --surface-*) from design-tokens.css
// to align with the project design system.
const SCENE_THEME = {
  background: 0x1a1a2e,
  fog:        0x1a1a2e,
} as const;

const scene = new THREE.Scene();
scene.background = new THREE.Color(SCENE_THEME.background);
scene.fog = new THREE.Fog(SCENE_THEME.fog, 50, 200);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("app")!.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
