import * as Phaser from "phaser";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArcadeTarget =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

export type SoldierSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & {
  hp: number;
  dir: number;
  nextShotAt: number;
  activated: boolean;
  patrolMin: number;
  patrolMax: number;
};

export type TurretEntry = {
  base: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  barrel: Phaser.GameObjects.Image;
  hp: number;
  nextShotAt: number;
  activated: boolean;
};

export type BossData = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  dir: 1 | -1;
  nextShotAt: number;
  hpBar: Phaser.GameObjects.Rectangle;
  hpBarFill: Phaser.GameObjects.Rectangle;
  hpLabel: Phaser.GameObjects.Text;
  defeated: boolean;
};

export type SpikeTrapEntry = {
  x: number;
  width: number;
  cycleMs: number;
  activeDurationMs: number;
  active: boolean;
  nextToggleAt: number;
  glow: Phaser.GameObjects.Rectangle;
  spikes: Phaser.GameObjects.Triangle[];
};

export type SniperNestEntry = {
  x: number;
  y: number;
  cooldownMs: number;
  activated: boolean;
  nextShotAt: number;
  fireAt: number;
  targetX: number;
  targetY: number;
  warningLine: Phaser.GameObjects.Graphics;
  warningReticle: Phaser.GameObjects.Arc;
};

export type LaserGateEntry = {
  x: number;
  topY: number;
  height: number;
  cycleMs: number;
  activeDurationMs: number;
  active: boolean;
  nextToggleAt: number;
  beam: Phaser.GameObjects.Rectangle;
  topCore: Phaser.GameObjects.Arc;
  bottomCore: Phaser.GameObjects.Arc;
};
