type IsoDirection = "S" | "SW" | "W" | "NW" | "N" | "NE" | "E" | "SE";

interface IsoEntity {
  sprite: Phaser.GameObjects.Sprite;
  tileX: number;
  tileY: number;
  direction: IsoDirection;
  state: "idle" | "walk" | "attack" | "hurt" | "die";
  health: number;
  speed: number;
}

const ISO_DIRS: Record<string, [number, number]> = {
  "S":  [ 0,  1], "SW": [-1,  1], "W":  [-1, 0], "NW": [-1, -1],
  "N":  [ 0, -1], "NE": [ 1, -1], "E":  [ 1, 0], "SE": [ 1,  1],
};
