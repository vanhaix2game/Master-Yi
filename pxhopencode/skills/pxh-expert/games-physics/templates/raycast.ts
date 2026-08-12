interface RayHit {
  point: { x: number; y: number };
  distance: number;
  objectId: number;
}

function raycast(
  ox: number, oy: number,
  dx: number, dy: number,
  maxDist: number,
  objects: { id: number; x: number; y: number; w: number; h: number }[]
): RayHit | null {
  let closest: RayHit | null = null;

  for (const obj of objects) {
    const hit = rayVsAABB(ox, oy, dx, dy, obj);
    if (hit && hit.distance <= maxDist) {
      if (!closest || hit.distance < closest.distance) {
        closest = { ...hit, objectId: obj.id };
      }
    }
  }

  return closest;
}

function rayVsAABB(
  ox: number, oy: number,
  dx: number, dy: number,
  box: { x: number; y: number; w: number; h: number }
): { point: { x: number; y: number }; distance: number } | null {
  const t1 = (box.x - ox) / dx;
  const t2 = (box.x + box.w - ox) / dx;
  const t3 = (box.y - oy) / dy;
  const t4 = (box.y + box.h - oy) / dy;

  const tMin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
  const tMax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

  if (tMax < 0 || tMin > tMax) return null;

  const t = tMin < 0 ? tMax : tMin;
  return {
    point: { x: ox + dx * t, y: oy + dy * t },
    distance: t,
  };
}
