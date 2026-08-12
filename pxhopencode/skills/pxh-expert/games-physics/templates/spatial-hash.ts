class SpatialHash {
  private cells = new Map<string, number[]>();
  private cellSize: number;

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  private key(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  clear() {
    this.cells.clear();
  }

  insert(id: number, x: number, y: number, w: number, h: number) {
    const minX = Math.floor(x / this.cellSize);
    const minY = Math.floor(y / this.cellSize);
    const maxX = Math.floor((x + w) / this.cellSize);
    const maxY = Math.floor((y + h) / this.cellSize);

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const k = `${cx},${cy}`;
        if (!this.cells.has(k)) this.cells.set(k, []);
        this.cells.get(k)!.push(id);
      }
    }
  }

  query(x: number, y: number, w: number, h: number): Set<number> {
    const result = new Set<number>();
    const minX = Math.floor(x / this.cellSize);
    const minY = Math.floor(y / this.cellSize);
    const maxX = Math.floor((x + w) / this.cellSize);
    const maxY = Math.floor((y + h) / this.cellSize);

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const k = `${cx},${cy}`;
        const cell = this.cells.get(k);
        if (cell) cell.forEach(id => result.add(id));
      }
    }
    return result;
  }
}
