function showSelectionIndicator(tileX: number, tileY: number) {
  const pos = cartToIso(tileX, tileY);
  const g = document.getElementById("selection-indicator")
    || (() => {
      const el = document.createElement("div");
      el.id = "selection-indicator";
      el.style.cssText = "position:absolute;width:64px;height:32px;border:2px solid #0f0;pointer-events:none;z-index:10;transition:all 0.15s;box-sizing:border-box;";
      document.getElementById("game")?.appendChild(el);
      return el;
    })();
  g.style.left = `${pos.x - 32}px`;
  g.style.top = `${pos.y - 16}px`;
}

function showMovementRange(tiles: { x: number; y: number }[]) {
  const container = document.getElementById("movement-range")
    || (() => {
      const el = document.createElement("div");
      el.id = "movement-range";
      el.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:5;";
      document.getElementById("game")?.appendChild(el);
      return el;
    })();
  container.innerHTML = "";
  tiles.forEach(t => {
    const pos = cartToIso(t.x, t.y);
    const dot = document.createElement("div");
    dot.style.cssText = `position:absolute;left:${pos.x - 6}px;top:${pos.y - 6}px;width:12px;height:12px;border-radius:50%;background:rgba(0,255,0,0.3);border:1px solid rgba(0,255,0,0.6);`;
    container.appendChild(dot);
  });
}

function showAttackRange(tiles: { x: number; y: number }[]) {
  const container = document.getElementById("attack-range")
    || (() => {
      const el = document.createElement("div");
      el.id = "attack-range";
      el.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:6;";
      document.getElementById("game")?.appendChild(el);
      return el;
    })();
  container.innerHTML = "";
  tiles.forEach(t => {
    const pos = cartToIso(t.x, t.y);
    const dot = document.createElement("div");
    dot.style.cssText = `position:absolute;left:${pos.x - 6}px;top:${pos.y - 6}px;width:12px;height:12px;border-radius:50%;background:rgba(255,0,0,0.3);border:1px solid rgba(255,0,0,0.6);`;
    container.appendChild(dot);
  });
}
