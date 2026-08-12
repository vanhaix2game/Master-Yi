import Phaser from "phaser";
import PhaserIsometric from "phaser-isometric";
import { NEON } from "../../games-2d/templates/color-palettes";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: NEON.bg,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  plugins: {
    scene: [
      { key: "Isometric", plugin: PhaserIsometric, mapping: "iso" }
    ]
  },
  scene: [IsoGameScene],
};
