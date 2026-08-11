import * as THREE from "three";

export function createHeadlessRenderer() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setSize(800, 600);
  renderer.setPixelRatio(1);
  return { scene, camera, renderer };
}

export function disposeScene(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

export function createMockTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 2, 2);
  return new THREE.CanvasTexture(canvas);
}

export function advanceFrames(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, frames: number) {
  for (let i = 0; i < frames; i++) {
    renderer.render(scene, camera);
  }
}
