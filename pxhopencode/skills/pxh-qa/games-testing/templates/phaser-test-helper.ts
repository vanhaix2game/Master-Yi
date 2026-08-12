import Phaser from "phaser";

export function createHeadlessGame(scenes: (typeof Phaser.Scene)[]) {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.HEADLESS,
    width: 800,
    height: 600,
    parent: undefined,
    scene: scenes,
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    audio: { noAudio: true },
  };
  return new Phaser.Game(config);
}

export function getSceneInstance<T extends Phaser.Scene>(game: Phaser.Game, key: string) {
  return game.scene.getScene(key) as T;
}

export function advanceTime(game: Phaser.Game, ms: number) {
  return new Promise<void>(resolve => {
    const step = 16;
    const steps = Math.floor(ms / step);
    let count = 0;
    const tick = () => {
      if (count++ >= steps) { resolve(); return; }
      game.loop.step(step / 1000);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export function simulatePointer(game: Phaser.Game, x: number, y: number, action: "down" | "up" | "move") {
  game.input.emit("pointer" + action, { x, y, prevX: 0, prevY: 0 });
}
