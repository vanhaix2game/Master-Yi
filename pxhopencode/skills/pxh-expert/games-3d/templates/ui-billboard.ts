const BILLBOARD_STYLES = {
  font: `14px 'Inter', 'Segoe UI', system-ui, sans-serif`,
  textColor: '#ffffff',
  bgColor: 'rgba(10,10,32,0.85)',
  borderColor: 'rgba(0,255,255,0.3)',
  borderRadius: '8px',
  padding: '8px 14px',
};

export function styleBillboard(el: HTMLElement, overrides?: Partial<typeof BILLBOARD_STYLES>) {
  const s = { ...BILLBOARD_STYLES, ...overrides };
  Object.assign(el.style, {
    position: 'absolute',
    pointerEvents: 'none',
    font: s.font,
    color: s.textColor,
    background: s.bgColor,
    border: `1px solid ${s.borderColor}`,
    borderRadius: s.borderRadius,
    padding: s.padding,
    backdropFilter: 'blur(4px)',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.25s ease',
  });
}

export function createBillboard(
  element: HTMLElement,
  target: THREE.Object3D,
  camera: THREE.Camera,
  offsetY = 2
) {
  const vector = target.position.clone().add(new THREE.Vector3(0, offsetY, 0));
  vector.project(camera);

  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

  element.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
  element.style.display = vector.z < 1 ? "block" : "none";
}

const CROSSHAIR_THEME = {
  color: '#ffffff',
  hitColor: '#ff3366',
  lineWidth: 2,
  size: 12,
  gap: 5,
  dotRadius: 2,
};

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  theme?: Partial<typeof CROSSHAIR_THEME>
) {
  const t = { ...CROSSHAIR_THEME, ...theme };
  const cx = ctx.canvas.width / 2;
  const cy = ctx.canvas.height / 2;
  const { size, gap } = t;

  ctx.strokeStyle = t.color;
  ctx.lineWidth = t.lineWidth;
  ctx.shadowColor = t.color;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(cx - size, cy); ctx.lineTo(cx - gap, cy);
  ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + size, cy);
  ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy - gap);
  ctx.moveTo(cx, cy + gap); ctx.lineTo(cx, cy + size);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = t.color;
  ctx.beginPath();
  ctx.arc(cx, cy, t.dotRadius, 0, Math.PI * 2);
  ctx.fill();
}
