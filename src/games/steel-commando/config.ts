export const STEEL_COMMANDO_SLUG = "steel-commando";

// Canvas
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

// World
export const WORLD_WIDTH = 5760;
export const GROUND_TOP_Y = 576; // y where terrain top sits

// Player
export const PLAYER_W = 32;
export const PLAYER_H = 48;
export const PLAYER_SPEED = 210;
export const PLAYER_JUMP_VEL = -580;
export const PLAYER_GRAVITY = 900;
export const SHOOT_COOLDOWN_MS = 180; // pistol fire rate
export const INVINCIBLE_MS = 1800; // invincibility after hit

// Weapons
export const WEAPON_TYPES = ["pistol", "spread", "laser"] as const;
export type WeaponType = (typeof WEAPON_TYPES)[number];

// Bullet
export const BULLET_SPEED = 520;
export const ENEMY_BULLET_SPEED = 280;

// Soldiers
export const SOLDIER_W = 28;
export const SOLDIER_H = 40;
export const SOLDIER_SPEED = 80;
export const SOLDIER_HP = 2;
export const SOLDIER_SHOOT_INTERVAL_MIN = 1800;
export const SOLDIER_SHOOT_INTERVAL_MAX = 3200;
export const SOLDIER_ACTIVATE_DIST = 600; // pixels from camera right edge

// Turrets
export const TURRET_HP = 5;
export const TURRET_SHOOT_INTERVAL = 1400;
export const TURRET_ACTIVATE_DIST = 500;

// Boss
export const BOSS_W = 80;
export const BOSS_H = 80;
export const BOSS_HP = 60;
export const BOSS_SPEED_1 = 90;
export const BOSS_SPEED_2 = 130;
export const BOSS_SPEED_3 = 170;
export const BOSS_SHOOT_INTERVAL_1 = 1800;
export const BOSS_SHOOT_INTERVAL_2 = 1200;
export const BOSS_SHOOT_INTERVAL_3 = 800;
export const BOSS_X = 5200;

// Platforms
export const PLATFORM_H = 16;
export const P1_Y = GROUND_TOP_Y - 80;  // lower platform tier
export const P2_Y = GROUND_TOP_Y - 160; // upper platform tier

// HUD
export const MAX_LIVES = 3;
export const SCORE_PER_SOLDIER = 100;
export const SCORE_PER_TURRET = 300;
export const SCORE_PER_BOSS = 2000;
