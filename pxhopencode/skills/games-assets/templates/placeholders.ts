import { NEON } from "../../games-2d/templates/color-palettes";

function generatePlaceholderSprite(color: string, size = 32): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = NEON.muted;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(2, 2, size - 4, size - 4);
  const cx = size / 2, cy = size / 2;
  ctx.fillStyle = NEON.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

function createFallbackPlayer(): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: NEON.primary, emissive: NEON.primary, emissiveIntensity: 0.15 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1, 4, 8), bodyMat);
  body.position.y = 1;
  group.add(body);
  const headMat = new THREE.MeshStandardMaterial({ color: NEON.secondary, emissive: NEON.secondary, emissiveIntensity: 0.1 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), headMat);
  head.position.y = 1.8;
  group.add(head);
  return group;
}
