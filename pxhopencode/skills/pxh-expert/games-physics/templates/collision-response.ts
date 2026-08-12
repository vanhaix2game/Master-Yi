interface CollisionResult {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  collided: boolean;
}

function resolveCollision(
  pos: { x: number; y: number },
  vel: { x: number; y: number },
  dt: number,
  solids: AABB[]
): CollisionResult {
  const newPos = {
    x: pos.x + vel.x * dt,
    y: pos.y + vel.y * dt,
  };

  let collided = false;

  for (const solid of solids) {
    const playerBox: AABB = { x: newPos.x - 0.4, y: newPos.y - 0.4, width: 0.8, height: 0.8 };
    if (!aabbOverlap(playerBox, solid)) continue;

    // Resolve X
    const overlapX = Math.min(newPos.x + 0.4 - solid.x, solid.x + solid.width - (newPos.x - 0.4));
    const overlapY = Math.min(newPos.y + 0.4 - solid.y, solid.y + solid.height - (newPos.y - 0.4));

    if (overlapX < overlapY) {
      if (vel.x > 0) newPos.x = solid.x - 0.4;
      else newPos.x = solid.x + solid.width + 0.4;
      vel.x = 0;
    } else {
      if (vel.y > 0) newPos.y = solid.y - 0.4;
      else newPos.y = solid.y + solid.height + 0.4;
      vel.y = 0;
    }
    collided = true;
  }

  return { position: newPos, velocity: vel, collided };
}
