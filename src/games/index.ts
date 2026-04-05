import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, TANK_BLITZ_SLUG } from "@/games/tank-blitz/config";
import { TankBlitzScene } from "@/games/tank-blitz/scene";

export function createGameConfig(slug: string, parent: string | HTMLElement): Phaser.Types.Core.GameConfig {
  const scene = slug === TANK_BLITZ_SLUG ? TankBlitzScene : TankBlitzScene;

  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#050913",
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [scene],
  };
}
