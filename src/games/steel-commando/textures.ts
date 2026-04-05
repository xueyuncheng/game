import * as Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLATFORM_H,
  PLAYER_W,
  PLAYER_H,
  SOLDIER_W,
  SOLDIER_H,
} from "@/games/steel-commando/config";

// ─── Draw helpers ─────────────────────────────────────────────────────────────

function drawPlayerFrame(g: Phaser.GameObjects.Graphics, frame: number) {
  // Body
  g.fillStyle(0x4a88cc, 1);
  g.fillRect(8, 16, 16, 20);
  // Head
  g.fillStyle(0xf8c89a, 1);
  g.fillRect(10, 4, 12, 12);
  // Helmet
  g.fillStyle(0x3a6aaa, 1);
  g.fillRect(9, 2, 14, 8);
  // Legs (animated)
  const legOffset = [0, 4, 0, -4][frame];
  g.fillStyle(0x3a5a8a, 1);
  g.fillRect(8, 36, 7, 10 + legOffset);
  g.fillRect(17, 36, 7, 10 - legOffset);
  // Gun
  g.fillStyle(0x2a2a2a, 1);
  g.fillRect(22, 18, 10, 4);
  // Arm
  g.fillStyle(0x4a88cc, 1);
  g.fillRect(20, 20, 6, 6);
}

function drawPlayerCrouch(g: Phaser.GameObjects.Graphics) {
  // Body (squashed)
  g.fillStyle(0x4a88cc, 1);
  g.fillRect(8, 10, 16, 14);
  // Head
  g.fillStyle(0xf8c89a, 1);
  g.fillRect(10, 2, 12, 10);
  // Helmet
  g.fillStyle(0x3a6aaa, 1);
  g.fillRect(9, 0, 14, 6);
  // Legs (crouched)
  g.fillStyle(0x3a5a8a, 1);
  g.fillRect(6, 22, 8, 8);
  g.fillRect(18, 22, 8, 8);
  // Gun
  g.fillStyle(0x2a2a2a, 1);
  g.fillRect(22, 12, 10, 4);
}

function drawSoldierFrame(g: Phaser.GameObjects.Graphics, frame: number) {
  // Body
  g.fillStyle(0x8a5a2a, 1);
  g.fillRect(6, 14, 16, 18);
  // Head
  g.fillStyle(0xd4a07a, 1);
  g.fillRect(8, 4, 12, 10);
  // Helmet
  g.fillStyle(0x6a4a1a, 1);
  g.fillRect(7, 2, 14, 7);
  // Legs
  const legOffset = [0, 3, 0, -3][frame];
  g.fillStyle(0x6a4a1a, 1);
  g.fillRect(6, 32, 6, 8 + legOffset);
  g.fillRect(16, 32, 6, 8 - legOffset);
  // Gun
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(20, 16, 8, 3);
}

function drawBoss(g: Phaser.GameObjects.Graphics, phase: 1 | 2 | 3) {
  const color = phase === 1 ? 0x8844aa : phase === 2 ? 0xcc2244 : 0xff4400;
  const detail = phase === 1 ? 0x6622aa : phase === 2 ? 0xaa1133 : 0xdd2200;
  // Main body
  g.fillStyle(color, 1);
  g.fillRect(10, 20, 60, 50);
  // Shoulders
  g.fillStyle(detail, 1);
  g.fillRect(0, 24, 16, 30);
  g.fillRect(64, 24, 16, 30);
  // Head
  g.fillStyle(color, 1);
  g.fillRect(22, 4, 36, 22);
  // Eyes (glowing)
  const eyeColor = phase === 3 ? 0xffffff : 0xffee00;
  g.fillStyle(eyeColor, 1);
  g.fillRect(28, 10, 8, 6);
  g.fillRect(44, 10, 8, 6);
  // Cannon arms
  g.fillStyle(0x222222, 1);
  g.fillRect(0, 38, 14, 6);
  g.fillRect(66, 38, 14, 6);
  // Armor details
  g.lineStyle(2, detail, 0.8);
  g.strokeRect(12, 22, 56, 46);
  g.lineStyle(1, eyeColor, 0.4);
  g.lineBetween(20, 40, 60, 40);
}

function drawExplosionFrame(g: Phaser.GameObjects.Graphics, frame: number) {
  const r = 6 + frame * 6;
  const alpha = 1 - frame * 0.2;
  g.fillStyle(0xffee00, alpha);
  g.fillCircle(24, 24, r);
  g.fillStyle(0xff6600, alpha * 0.8);
  g.fillCircle(24, 24, r * 0.6);
  if (frame > 0) {
    g.fillStyle(0xff2200, alpha * 0.6);
    g.fillCircle(24 - r / 3, 24 - r / 3, r * 0.3);
    g.fillCircle(24 + r / 3, 24 - r / 3, r * 0.3);
  }
  // sparks
  g.fillStyle(0xffcc00, alpha);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + frame * 0.5;
    const sr = r + frame * 4;
    const sx = 24 + Math.cos(angle) * sr;
    const sy = 24 + Math.sin(angle) * sr;
    g.fillRect(sx - 1, sy - 1, 3, 3);
  }
}

// ─── Texture generation ───────────────────────────────────────────────────────

export function preloadTextures(scene: Phaser.Scene) {
  const g = scene.add.graphics();

  // Sky background
  g.clear();
  g.fillGradientStyle(0x0a1628, 0x0a1628, 0x1a2f4a, 0x1a2f4a, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.generateTexture("sc-sky", GAME_WIDTH, GAME_HEIGHT);

  // Ground tile (64×64)
  g.clear();
  g.fillStyle(0x3a4a2a, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(0x4a5a32, 1);
  g.fillRect(0, 0, 64, 8);
  g.lineStyle(1, 0x5a6e3a, 0.5);
  g.lineBetween(0, 8, 64, 8);
  g.lineStyle(1, 0x2a3820, 0.3);
  g.lineBetween(32, 8, 32, 64);
  g.generateTexture("sc-ground", 64, 64);

  // Platform tile
  g.clear();
  g.fillStyle(0x5c4a2a, 1);
  g.fillRect(0, 0, 64, PLATFORM_H);
  g.fillStyle(0x7a6235, 1);
  g.fillRect(0, 0, 64, 4);
  g.lineStyle(1, 0x9a7a44, 0.4);
  g.lineBetween(0, 4, 64, 4);
  g.generateTexture("sc-platform", 64, PLATFORM_H);

  // Mountain silhouette for bg parallax
  g.clear();
  g.fillStyle(0x0e1f36, 1);
  for (let i = 0; i < 12; i++) {
    const mx = i * 100 + 40;
    const mh = 80 + (i * 37) % 70;
    g.fillTriangle(mx - 60, 260, mx + 60, 260, mx, 260 - mh);
  }
  g.generateTexture("sc-mountains", GAME_WIDTH, 260);

  // Building silhouette
  g.clear();
  g.fillStyle(0x0d1a2e, 1);
  for (let i = 0; i < 8; i++) {
    const bx = i * 140 + 20;
    const bw = 60 + (i * 23) % 40;
    const bh = 100 + (i * 43) % 80;
    g.fillRect(bx, 220 - bh, bw, bh);
    // windows
    g.fillStyle(0x2a4a6a, 0.6);
    for (let wy = 0; wy < 4; wy++) {
      for (let wx = 0; wx < 3; wx++) {
        if ((wy + wx + i) % 3 !== 0) {
          g.fillRect(bx + 8 + wx * 18, 220 - bh + 10 + wy * 22, 10, 14);
        }
      }
    }
    g.fillStyle(0x0d1a2e, 1);
  }
  g.generateTexture("sc-buildings", GAME_WIDTH, 220);

  // Player run frames (32×48)
  for (let f = 0; f < 4; f++) {
    g.clear();
    drawPlayerFrame(g, f);
    g.generateTexture(`sc-player-run-${f}`, PLAYER_W, PLAYER_H);
  }

  // Player idle
  g.clear();
  drawPlayerFrame(g, 0);
  g.generateTexture("sc-player-idle", PLAYER_W, PLAYER_H);

  // Player jump
  g.clear();
  drawPlayerFrame(g, 1);
  g.generateTexture("sc-player-jump", PLAYER_W, PLAYER_H);

  // Player crouch
  g.clear();
  drawPlayerCrouch(g);
  g.generateTexture("sc-player-crouch", PLAYER_W, 32);

  // Player death
  g.clear();
  g.fillStyle(0xff4444, 1);
  g.fillCircle(PLAYER_W / 2, PLAYER_H / 2, 12);
  g.fillStyle(0xff8800, 0.8);
  g.fillCircle(PLAYER_W / 2, PLAYER_H / 2, 7);
  g.generateTexture("sc-player-dead", PLAYER_W, PLAYER_H);

  // Soldier walk frames (28×40)
  for (let f = 0; f < 4; f++) {
    g.clear();
    drawSoldierFrame(g, f);
    g.generateTexture(`sc-soldier-walk-${f}`, SOLDIER_W, SOLDIER_H);
  }

  // Turret base (40×24)
  g.clear();
  g.fillStyle(0x4a5a3a, 1);
  g.fillRect(0, 8, 40, 16);
  g.fillStyle(0x5a6e4a, 1);
  g.fillRect(4, 4, 32, 12);
  g.fillStyle(0x3a4a2a, 1);
  g.fillRect(8, 0, 24, 8);
  g.lineStyle(1, 0x7a8a5a, 0.5);
  g.strokeRect(0, 8, 40, 16);
  g.generateTexture("sc-turret-base", 40, 24);

  // Turret barrel (8×24)
  g.clear();
  g.fillStyle(0x6a7a5a, 1);
  g.fillRect(2, 0, 6, 22);
  g.fillStyle(0x3a4a2a, 1);
  g.fillRect(0, 18, 10, 6);
  g.generateTexture("sc-turret-barrel", 10, 24);

  // Boss (80×80)
  g.clear();
  drawBoss(g, 1);
  g.generateTexture("sc-boss-1", 80, 80);

  g.clear();
  drawBoss(g, 2);
  g.generateTexture("sc-boss-2", 80, 80);

  g.clear();
  drawBoss(g, 3);
  g.generateTexture("sc-boss-3", 80, 80);

  // Player bullet (6×12)
  g.clear();
  g.fillStyle(0xffee66, 1);
  g.fillRect(1, 0, 4, 10);
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(2, 0, 2, 4);
  g.generateTexture("sc-bullet-player", 6, 12);

  // Spread bullet (6×8)
  g.clear();
  g.fillStyle(0xff8844, 1);
  g.fillRect(1, 0, 4, 8);
  g.generateTexture("sc-bullet-spread", 6, 8);

  // Laser bullet (4×20)
  g.clear();
  g.fillStyle(0x44ffee, 1);
  g.fillRect(0, 0, 4, 20);
  g.fillStyle(0xaaffff, 0.5);
  g.fillRect(1, 0, 2, 20);
  g.generateTexture("sc-bullet-laser", 4, 20);

  // Enemy bullet (8×8)
  g.clear();
  g.fillStyle(0xff4466, 1);
  g.fillCircle(4, 4, 4);
  g.fillStyle(0xff8899, 0.6);
  g.fillCircle(3, 3, 2);
  g.generateTexture("sc-bullet-enemy", 8, 8);

  // Pickup: spread (24×24)
  g.clear();
  g.fillStyle(0xffaa00, 1);
  g.fillCircle(12, 12, 11);
  g.fillStyle(0xffee44, 1);
  g.fillTriangle(6, 16, 12, 4, 18, 16);
  g.fillTriangle(2, 14, 12, 10, 8, 20);
  g.fillTriangle(22, 14, 12, 10, 16, 20);
  g.generateTexture("sc-pickup-spread", 24, 24);

  // Pickup: laser (24×24)
  g.clear();
  g.fillStyle(0x00ccee, 1);
  g.fillCircle(12, 12, 11);
  g.fillStyle(0xaaffff, 1);
  g.fillRect(5, 6, 4, 14);
  g.fillRect(10, 4, 4, 16);
  g.fillRect(15, 6, 4, 14);
  g.generateTexture("sc-pickup-laser", 24, 24);

  // Life icon (20×20)
  g.clear();
  g.fillStyle(0x66ddff, 1);
  g.fillRect(6, 2, 8, 14);
  g.fillRect(2, 6, 6, 8);
  g.fillRect(12, 6, 6, 8);
  g.generateTexture("sc-life-icon", 20, 20);

  // Explosion frames (4 frames, 48×48)
  for (let f = 0; f < 4; f++) {
    g.clear();
    drawExplosionFrame(g, f);
    g.generateTexture(`sc-explosion-${f}`, 48, 48);
  }

  g.destroy();
}
