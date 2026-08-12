function findPath(start: { x: number; y: number }, end: { x: number; y: number }, map: number[][]) {
  const openSet = [start];
  const cameFrom = new Map<string, { x: number; y: number }>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;
  gScore.set(key(start), 0);
  fScore.set(key(start), heuristic(start, end));

  while (openSet.length > 0) {
    const current = openSet.reduce((a, b) =>
      (fScore.get(key(a)) ?? Infinity) < (fScore.get(key(b)) ?? Infinity) ? a : b
    );

    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(cameFrom, current);
    }

    openSet.splice(openSet.indexOf(current), 1);

    for (const neighbor of getNeighbors(current, map)) {
      const tentativeG = (gScore.get(key(current)) ?? Infinity) + 1;
      if (tentativeG < (gScore.get(key(neighbor)) ?? Infinity)) {
        cameFrom.set(key(neighbor), current);
        gScore.set(key(neighbor), tentativeG);
        fScore.set(key(neighbor), tentativeG + heuristic(neighbor, end));
        if (!openSet.find(o => o.x === neighbor.x && o.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return [];
}

function heuristic(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNeighbors(p: { x: number; y: number }, map: number[][]) {
  const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
  return dirs
    .map(d => ({ x: p.x + d.x, y: p.y + d.y }))
    .filter(n =>
      n.y >= 0 && n.y < map.length &&
      n.x >= 0 && n.x < map[0].length &&
      map[n.y][n.x] === 0
    );
}
