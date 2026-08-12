interface AABB {
  x: number; y: number;
  width: number; height: number;
}

function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Swept AABB (ngăn object xuyên qua khi di chuyển nhanh)
function sweptAABB(a: AABB, b: AABB, vx: number, vy: number): { hit: boolean; t: number; nx: number; ny: number } {
  const entry: AABB = {
    x: vx > 0 ? b.x - (a.x + a.width) : (b.x + b.width) - a.x,
    y: vy > 0 ? b.y - (a.y + a.height) : (b.y + b.height) - a.y,
    width: vx > 0 ? b.width + a.width : -(b.width + a.width),
    height: vy > 0 ? b.height + a.height : -(b.height + a.height),
  };

  const tx = entry.x / vx;
  const ty = entry.y / vy;

  const tEntry = Math.max(
    vx !== 0 ? tx : -Infinity,
    vy !== 0 ? ty : -Infinity,
    0
  );
  const tExit = Math.min(
    vx !== 0 ? entry.width / vx : Infinity,
    vy !== 0 ? entry.height / vy : Infinity,
    1
  );

  if (tEntry > tExit || tEntry < 0 || tEntry > 1) {
    return { hit: false, t: 1, nx: 0, ny: 0 };
  }

  return {
    hit: true,
    t: tEntry,
    nx: tx > ty ? (vx > 0 ? -1 : 1) : 0,
    ny: ty > tx ? (vy > 0 ? -1 : 1) : 0,
  };
}
