import * as Phaser from "phaser";

// ─── Animation definitions ────────────────────────────────────────────────────

export function createAnimations(scene: Phaser.Scene) {
  scene.anims.create({
    key: "sc-run",
    frames: [
      { key: "sc-player-run-0" },
      { key: "sc-player-run-1" },
      { key: "sc-player-run-2" },
      { key: "sc-player-run-3" },
    ],
    frameRate: 10,
    repeat: -1,
  });

  scene.anims.create({
    key: "sc-idle",
    frames: [{ key: "sc-player-idle" }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: "sc-jump",
    frames: [{ key: "sc-player-jump" }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: "sc-crouch",
    frames: [{ key: "sc-player-crouch" }],
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: "sc-dead",
    frames: [{ key: "sc-player-dead" }],
    frameRate: 1,
    repeat: -1,
  });

  // Soldier walk
  scene.anims.create({
    key: "sc-soldier-walk",
    frames: [
      { key: "sc-soldier-walk-0" },
      { key: "sc-soldier-walk-1" },
      { key: "sc-soldier-walk-2" },
      { key: "sc-soldier-walk-3" },
    ],
    frameRate: 8,
    repeat: -1,
  });

  // Explosion
  scene.anims.create({
    key: "sc-explode",
    frames: [
      { key: "sc-explosion-0" },
      { key: "sc-explosion-1" },
      { key: "sc-explosion-2" },
      { key: "sc-explosion-3" },
    ],
    frameRate: 12,
    repeat: 0,
  });
}
