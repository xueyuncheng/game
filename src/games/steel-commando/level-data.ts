import { GROUND_TOP_Y, P1_Y, P2_Y, type WeaponType } from "@/games/steel-commando/config";

// ─── Platform layout ─────────────────────────────────────────────────────────
// [x, y, width]
export const PLATFORM_DEFS: [number, number, number][] = [
  [320, P1_Y, 128],
  [520, P2_Y, 96],
  [780, P1_Y, 160],
  [1100, P1_Y, 128],
  [1300, P2_Y, 96],
  [1600, P1_Y, 192],
  [1900, P2_Y, 112],
  [2200, P1_Y, 160],
  [2500, P1_Y, 128],
  [2700, P2_Y, 96],
  [3000, P1_Y, 160],
  [3400, P2_Y, 112],
  [3800, P1_Y, 192],
  [4200, P1_Y, 128],
  [4500, P2_Y, 96],
  [4800, P1_Y, 160],
];

// ─── Soldier spawn positions [x, patrolRadius] ───────────────────────────────
export const SOLDIER_DEFS: [number, number][] = [
  [500, 80],
  [800, 60],
  [1050, 80],
  [1350, 60],
  [1650, 80],
  [1950, 60],
  [2250, 80],
  [2500, 60],
  [2750, 80],
  [3050, 60],
  [3300, 80],
  [3600, 60],
  [3900, 80],
  [4150, 60],
  [4400, 80],
  [4650, 60],
  [4900, 80],
  [5050, 60],
  [5150, 40],
  [5300, 40],
];

// ─── Turret positions [x, y] ──────────────────────────────────────────────────
export const TURRET_DEFS: [number, number][] = [
  [900, GROUND_TOP_Y - 20],
  [1800, GROUND_TOP_Y - 20],
  [2900, GROUND_TOP_Y - 20],
  [4050, GROUND_TOP_Y - 20],
];

// ─── Weapon pickup positions [x, weapon] ─────────────────────────────────────
export const PICKUP_DEFS: [number, WeaponType][] = [
  [700, "spread"],
  [2000, "laser"],
  [3500, "spread"],
  [4700, "laser"],
];
