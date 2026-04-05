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

type ThemeKey = "jungle" | "mountain" | "fortress";

type ThemePalette = {
  skyTop: number;
  skyBottom: number;
  farColor: number;
  farAccent: number;
  midColor: number;
  midAccent: number;
  groundBase: number;
  groundTop: number;
  groundLine: number;
  groundShadow: number;
  platformBase: number;
  platformTop: number;
  platformAccent: number;
};

const THEME_PALETTES: Record<ThemeKey, ThemePalette> = {
  jungle: {
    skyTop: 0x0d2430,
    skyBottom: 0x2d5f63,
    farColor: 0x193746,
    farAccent: 0x24524d,
    midColor: 0x173d27,
    midAccent: 0x4c7f46,
    groundBase: 0x364728,
    groundTop: 0x5a7b3c,
    groundLine: 0x9ec86a,
    groundShadow: 0x202c17,
    platformBase: 0x5d4b2d,
    platformTop: 0x90723e,
    platformAccent: 0xcaa66b,
  },
  mountain: {
    skyTop: 0x30284c,
    skyBottom: 0x885763,
    farColor: 0x2c3254,
    farAccent: 0x6f7ea7,
    midColor: 0x485266,
    midAccent: 0x9dabc2,
    groundBase: 0x55515b,
    groundTop: 0x908979,
    groundLine: 0xd3c7b0,
    groundShadow: 0x2a2f36,
    platformBase: 0x6c6057,
    platformTop: 0xb59d77,
    platformAccent: 0xe6d5ae,
  },
  fortress: {
    skyTop: 0x120d1f,
    skyBottom: 0x431d26,
    farColor: 0x24192b,
    farAccent: 0x642331,
    midColor: 0x303544,
    midAccent: 0xd86e4b,
    groundBase: 0x313640,
    groundTop: 0x5e6672,
    groundLine: 0xaeb8c6,
    groundShadow: 0x1a1d24,
    platformBase: 0x474d58,
    platformTop: 0x7f8895,
    platformAccent: 0xdce3ee,
  },
};

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

function drawSkyTexture(g: Phaser.GameObjects.Graphics, theme: ThemeKey, palette: ThemePalette) {
  g.clear();
  g.fillGradientStyle(palette.skyTop, palette.skyTop, palette.skyBottom, palette.skyBottom, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (theme === "jungle") {
    g.fillStyle(0xf7d37a, 0.35);
    g.fillCircle(160, 120, 48);
    g.fillStyle(0xb8ffeb, 0.08);
    g.fillRect(0, 340, GAME_WIDTH, 42);
    g.fillRect(0, 410, GAME_WIDTH, 26);
  } else if (theme === "mountain") {
    g.fillStyle(0xffc47b, 0.4);
    g.fillCircle(760, 116, 56);
    g.fillStyle(0xffffff, 0.08);
    g.fillEllipse(180, 150, 170, 36);
    g.fillEllipse(420, 118, 120, 28);
    g.fillEllipse(700, 176, 180, 34);
  } else {
    g.fillStyle(0xff6a4d, 0.18);
    g.fillCircle(770, 120, 42);
    g.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 18; i++) {
      const x = 60 + ((i * 47) % (GAME_WIDTH - 120));
      const y = 40 + ((i * 29) % 180);
      g.fillRect(x, y, 2, 2);
    }
  }
}

function drawMountainTexture(g: Phaser.GameObjects.Graphics, theme: ThemeKey, palette: ThemePalette) {
  g.clear();
  g.fillStyle(palette.farColor, 1);

  if (theme === "jungle") {
    for (let i = 0; i < 7; i++) {
      const cx = i * 150 + 70;
      const w = 260 + (i % 2) * 40;
      const h = 70 + (i % 3) * 18;
      g.fillEllipse(cx, 260, w, h);
    }
    g.fillStyle(palette.farAccent, 0.85);
    for (let i = 0; i < 5; i++) {
      const mx = i * 180 + 120;
      const mh = 60 + (i % 2) * 24;
      g.fillTriangle(mx - 40, 250, mx + 40, 250, mx, 250 - mh);
    }
  } else if (theme === "mountain") {
    for (let i = 0; i < 11; i++) {
      const mx = i * 96 + 40;
      const mh = 90 + (i * 37) % 90;
      g.fillTriangle(mx - 58, 260, mx + 58, 260, mx, 260 - mh);
    }
    g.fillStyle(palette.farAccent, 0.5);
    for (let i = 0; i < 5; i++) {
      const rx = i * 210 + 90;
      g.fillTriangle(rx - 40, 240, rx + 16, 240, rx - 6, 170);
    }
  } else {
    for (let i = 0; i < 9; i++) {
      const bx = i * 112;
      const bw = 92 + (i % 3) * 18;
      const bh = 88 + (i % 4) * 22;
      g.fillRect(bx, 260 - bh, bw, bh);
      g.fillTriangle(bx + bw - 16, 260 - bh, bx + bw + 12, 260 - bh, bx + bw - 2, 260 - bh - 28);
    }
    g.fillStyle(palette.farAccent, 0.55);
    for (let i = 0; i < 4; i++) {
      const sx = i * 230 + 90;
      g.fillRect(sx, 120, 12, 140);
      g.fillRect(sx + 14, 150, 8, 110);
    }
  }
}

function drawBuildingTexture(g: Phaser.GameObjects.Graphics, theme: ThemeKey, palette: ThemePalette) {
  g.clear();

  if (theme === "jungle") {
    g.fillStyle(palette.midColor, 1);
    for (let i = 0; i < 10; i++) {
      const tx = i * 105 + 24;
      const trunkH = 100 + (i % 3) * 34;
      g.fillRect(tx, 220 - trunkH, 18, trunkH);
      g.fillStyle(palette.midAccent, 0.9);
      g.fillCircle(tx + 9, 220 - trunkH + 14, 30 + (i % 2) * 8);
      g.fillCircle(tx - 10, 220 - trunkH + 28, 24);
      g.fillCircle(tx + 26, 220 - trunkH + 32, 26);
      g.fillStyle(palette.midColor, 1);
    }

    for (let i = 0; i < 4; i++) {
      const ox = i * 230 + 80;
      g.fillRect(ox, 160, 54, 60);
      g.fillStyle(0x6f5a33, 1);
      g.fillRect(ox + 8, 168, 38, 10);
      g.fillStyle(palette.midColor, 1);
    }
    return;
  }

  if (theme === "mountain") {
    g.fillStyle(palette.midColor, 1);
    for (let i = 0; i < 6; i++) {
      const cx = i * 165;
      g.fillTriangle(cx - 20, 220, cx + 120, 220, cx + 36, 120 + (i % 2) * 24);
    }
    g.fillStyle(palette.midAccent, 0.7);
    for (let i = 0; i < 5; i++) {
      const px = i * 190 + 50;
      g.fillRect(px, 120, 8, 100);
      g.fillRect(px + 42, 140, 8, 80);
      g.lineStyle(2, palette.midAccent, 0.6);
      g.lineBetween(px + 4, 130, px + 46, 150);
      g.lineBetween(px + 4, 150, px + 46, 170);
    }
    return;
  }

  g.fillStyle(palette.midColor, 1);
  for (let i = 0; i < 8; i++) {
    const bx = i * 128;
    const bw = 78 + (i % 2) * 18;
    const bh = 110 + (i % 3) * 26;
    g.fillRect(bx, 220 - bh, bw, bh);
    g.fillRect(bx + bw - 18, 220 - bh - 26, 16, 26);
    g.fillStyle(palette.midAccent, 0.75);
    for (let wy = 0; wy < 4; wy++) {
      for (let wx = 0; wx < 3; wx++) {
        if ((wx + wy + i) % 2 === 0) {
          g.fillRect(bx + 10 + wx * 18, 220 - bh + 12 + wy * 20, 10, 8);
        }
      }
    }
    g.fillStyle(palette.midColor, 1);
  }
}

function drawGroundTexture(g: Phaser.GameObjects.Graphics, theme: ThemeKey, palette: ThemePalette) {
  g.clear();
  g.fillStyle(palette.groundBase, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(palette.groundTop, 1);
  g.fillRect(0, 0, 64, 8);
  g.lineStyle(1, palette.groundLine, 0.5);
  g.lineBetween(0, 8, 64, 8);
  g.lineStyle(1, palette.groundShadow, 0.4);

  if (theme === "jungle") {
    g.lineBetween(16, 8, 10, 64);
    g.lineBetween(36, 8, 42, 64);
    g.lineBetween(54, 8, 50, 64);
  } else if (theme === "mountain") {
    g.lineBetween(18, 8, 12, 36);
    g.lineBetween(20, 34, 10, 64);
    g.lineBetween(44, 8, 54, 40);
    g.lineBetween(50, 38, 42, 64);
  } else {
    g.lineBetween(16, 8, 16, 64);
    g.lineBetween(32, 8, 32, 64);
    g.lineBetween(48, 8, 48, 64);
    g.lineBetween(0, 32, 64, 32);
  }
}

function drawPlatformTexture(g: Phaser.GameObjects.Graphics, theme: ThemeKey, palette: ThemePalette) {
  g.clear();
  g.fillStyle(palette.platformBase, 1);
  g.fillRect(0, 0, 64, PLATFORM_H);
  g.fillStyle(palette.platformTop, 1);
  g.fillRect(0, 0, 64, 4);
  g.lineStyle(1, palette.platformAccent, 0.5);
  g.lineBetween(0, 4, 64, 4);

  if (theme === "jungle") {
    g.lineStyle(1, 0x3c2e1b, 0.35);
    g.lineBetween(18, 0, 18, PLATFORM_H);
    g.lineBetween(39, 0, 39, PLATFORM_H);
    g.lineBetween(51, 0, 51, PLATFORM_H);
  } else if (theme === "mountain") {
    g.lineStyle(1, 0x4f4b46, 0.35);
    g.lineBetween(10, PLATFORM_H - 2, 22, 6);
    g.lineBetween(26, PLATFORM_H - 3, 38, 5);
    g.lineBetween(44, PLATFORM_H - 2, 56, 7);
  } else {
    g.lineStyle(1, 0x252932, 0.45);
    g.lineBetween(16, 0, 16, PLATFORM_H);
    g.lineBetween(32, 0, 32, PLATFORM_H);
    g.lineBetween(48, 0, 48, PLATFORM_H);
  }
}

function generateThemeTextures(
  g: Phaser.GameObjects.Graphics,
  theme: ThemeKey,
  palette: ThemePalette,
) {
  drawSkyTexture(g, theme, palette);
  g.generateTexture(`sc-${theme}-sky`, GAME_WIDTH, GAME_HEIGHT);

  drawGroundTexture(g, theme, palette);
  g.generateTexture(`sc-${theme}-ground`, 64, 64);

  drawPlatformTexture(g, theme, palette);
  g.generateTexture(`sc-${theme}-platform`, 64, PLATFORM_H);

  drawMountainTexture(g, theme, palette);
  g.generateTexture(`sc-${theme}-mountains`, GAME_WIDTH, 260);

  drawBuildingTexture(g, theme, palette);
  g.generateTexture(`sc-${theme}-buildings`, GAME_WIDTH, 220);
}

// ─── Texture generation ───────────────────────────────────────────────────────

export function preloadTextures(scene: Phaser.Scene) {
  if (scene.textures.exists("sc-player-idle") && scene.textures.exists("sc-jungle-sky")) {
    return;
  }

  const g = scene.add.graphics();

  generateThemeTextures(g, "jungle", THEME_PALETTES.jungle);
  generateThemeTextures(g, "mountain", THEME_PALETTES.mountain);
  generateThemeTextures(g, "fortress", THEME_PALETTES.fortress);

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
