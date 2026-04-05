import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, TANK_BLITZ_SLUG } from "@/games/tank-blitz/config";
import { TankBlitzScene } from "@/games/tank-blitz/scene";
import { STEEL_COMMANDO_SLUG } from "@/games/steel-commando/config";
import { SteelCommandoScene } from "@/games/steel-commando/scene";

export function createGameConfig(slug: string, parent: string | HTMLElement): Phaser.Types.Core.GameConfig {
  if (slug === STEEL_COMMANDO_SLUG) {
    return {
      type: Phaser.AUTO,
      parent,
      width: 960,
      height: 640,
      backgroundColor: "#0a1628",
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
      scene: [SteelCommandoScene],
    };
  }

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
