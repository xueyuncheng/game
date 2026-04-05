import { GROUND_TOP_Y, P0_Y, P1_Y, P2_Y, P3_Y, type WeaponType } from "@/games/steel-commando/config";

// ─── Level definition ─────────────────────────────────────────────────────────

export type LevelTheme = "jungle" | "mountain" | "fortress";

type PlatformDef = [number, number, number];
type SoldierDef = [number, number];
type TurretDef = [number, number];
type PickupDef = [number, number, WeaponType];
type SpikeTrapDef = [number, number, number];
type SniperNestDef = [number, number, number];
type LaserGateDef = [number, number, number, number];

export type LevelDef = {
  theme: LevelTheme;
  name: string;
  worldWidth: number;
  bossX: number;
  bossHp: number;
  bossSpeed: [number, number, number];
  platforms: PlatformDef[];
  soldiers: SoldierDef[];
  turrets: TurretDef[];
  pickups: PickupDef[];
  spikeTraps: SpikeTrapDef[];
  sniperNests: SniperNestDef[];
  laserGates: LaserGateDef[];
};

// ─── Level 1: Jungle Outpost ──────────────────────────────────────────────────

const level1: LevelDef = {
  theme: "jungle",
  name: "JUNGLE OUTPOST",
  worldWidth: 5760,
  bossX: 5220,
  bossHp: 40,
  bossSpeed: [120, 160, 200],

  platforms: [
    [320, P0_Y, 96],
    [560, P1_Y, 128],
    [820, P0_Y, 96],
    [1080, P2_Y, 128],
    [1360, P1_Y, 160],
    [1660, P0_Y, 112],
    [1980, P2_Y, 128],
    [2220, P3_Y, 96],
    [2480, P2_Y, 128],
    [2840, P1_Y, 160],
    [3220, P0_Y, 128],
    [3560, P2_Y, 128],
    [3880, P1_Y, 192],
    [4200, P3_Y, 96],
    [4480, P1_Y, 128],
    [4760, P0_Y, 112],
    [5000, P2_Y, 160],
  ],

  soldiers: [
    [480, 90], [760, 70], [1040, 80], [1320, 90], [1600, 70],
    [1900, 80], [2230, 60], [2500, 70], [2780, 90], [3080, 80],
    [3360, 70], [3660, 80], [3960, 70], [4260, 60], [4540, 80],
    [4820, 70], [5060, 60], [5180, 40], [5300, 40],
  ],

  turrets: [
    [900,  GROUND_TOP_Y - 20],
    [2140, P2_Y - 20],
    [3440, GROUND_TOP_Y - 20],
    [4620, P1_Y - 20],
  ],

  pickups: [
    [560,  P1_Y - 24, "spread"],
    [2220, P3_Y - 24, "laser"],
    [3560, P2_Y - 24, "spread"],
    [5000, P2_Y - 24, "laser"],
  ],

  spikeTraps: [
    [1180, 96, 2200],
    [2980, 128, 2400],
    [4740, 96, 2000],
  ],

  sniperNests: [],

  laserGates: [],
};

// ─── Level 2: Mountain Pass ───────────────────────────────────────────────────

const level2: LevelDef = {
  theme: "mountain",
  name: "MOUNTAIN PASS",
  worldWidth: 7040,
  bossX: 6620,
  bossHp: 52,
  bossSpeed: [140, 180, 220],

  platforms: [
    [280, P0_Y, 96],
    [520, P1_Y, 96],
    [780, P2_Y, 96],
    [1040, P3_Y, 128],
    [1320, P2_Y, 96],
    [1600, P1_Y, 160],
    [1900, P0_Y, 128],
    [2240, P1_Y, 96],
    [2500, P2_Y, 96],
    [2760, P3_Y, 96],
    [3050, P2_Y, 128],
    [3360, P1_Y, 128],
    [3720, P3_Y, 128],
    [4030, P2_Y, 96],
    [4340, P1_Y, 128],
    [4700, P3_Y, 96],
    [5000, P2_Y, 128],
    [5300, P1_Y, 160],
    [5680, P2_Y, 96],
    [5950, P3_Y, 96],
    [6210, P2_Y, 96],
    [6480, P1_Y, 160],
    [6780, P0_Y, 112],
  ],

  soldiers: [
    [460, 80], [720, 60], [980, 60], [1260, 70], [1540, 80],
    [1840, 60], [2140, 70], [2440, 60], [2700, 60], [3000, 70],
    [3320, 60], [3640, 70], [3920, 60], [4220, 70], [4520, 60],
    [4820, 70], [5120, 60], [5420, 70], [5720, 60], [6020, 60],
    [6280, 50], [6460, 50], [6540, 40], [6610, 40], [6670, 30],
    [6720, 30],
  ],

  turrets: [
    [900,  P2_Y - 20],
    [1680, GROUND_TOP_Y - 20],
    [2860, P3_Y - 20],
    [4200, P2_Y - 20],
    [5480, P3_Y - 20],
    [6400, P1_Y - 20],
  ],

  pickups: [
    [780,  P2_Y - 24, "spread"],
    [2760, P3_Y - 24, "laser"],
    [4340, P1_Y - 24, "spread"],
    [5950, P3_Y - 24, "laser"],
    [6480, P1_Y - 24, "spread"],
  ],

  spikeTraps: [],

  sniperNests: [
    [1180, 160, 2400],
    [3020, 130, 2200],
    [4860, 150, 2100],
    [6180, 170, 1800],
  ],

  laserGates: [],
};

// ─── Level 3: Final Fortress ──────────────────────────────────────────────────

const level3: LevelDef = {
  theme: "fortress",
  name: "IRON CITADEL",
  worldWidth: 8640,
  bossX: 8120,
  bossHp: 70,
  bossSpeed: [160, 200, 240],

  platforms: [
    [260, P0_Y, 128],
    [500, P1_Y, 160],
    [760, P0_Y, 96],
    [1020, P2_Y, 128],
    [1300, P1_Y, 96],
    [1540, P3_Y, 96],
    [1840, P0_Y, 160],
    [2120, P1_Y, 160],
    [2400, P2_Y, 128],
    [2660, P0_Y, 96],
    [2940, P3_Y, 96],
    [3240, P1_Y, 128],
    [3520, P2_Y, 128],
    [3800, P0_Y, 160],
    [4100, P1_Y, 128],
    [4380, P3_Y, 112],
    [4660, P2_Y, 128],
    [4940, P0_Y, 160],
    [5220, P1_Y, 128],
    [5500, P2_Y, 128],
    [5780, P3_Y, 112],
    [6060, P1_Y, 160],
    [6340, P0_Y, 128],
    [6620, P2_Y, 128],
    [6900, P1_Y, 128],
    [7180, P3_Y, 112],
    [7460, P2_Y, 128],
    [7740, P1_Y, 160],
    [8000, P2_Y, 160],
    [8280, P3_Y, 128],
  ],

  soldiers: [
    [420, 70], [700, 60], [980, 70], [1260, 60], [1500, 50],
    [1820, 70], [2080, 60], [2360, 60], [2640, 50], [2920, 50],
    [3200, 60], [3480, 60], [3760, 70], [4040, 60], [4320, 50],
    [4600, 60], [4880, 70], [5160, 60], [5440, 60], [5720, 50],
    [6000, 70], [6280, 60], [6560, 60], [6840, 60], [7120, 50],
    [7400, 60], [7660, 60], [7860, 50], [7980, 40], [8060, 40],
    [8120, 40], [8180, 30], [8240, 30], [8300, 30],
  ],

  turrets: [
    [620,  P1_Y - 20],
    [1360, P3_Y - 20],
    [2440, P2_Y - 20],
    [3400, P1_Y - 20],
    [4700, P2_Y - 20],
    [5900, P3_Y - 20],
    [7060, P2_Y - 20],
    [7920, P2_Y - 20],
    [8200, GROUND_TOP_Y - 20],
  ],

  pickups: [
    [500,  P1_Y - 24, "spread"],
    [1540, P3_Y - 24, "laser"],
    [3520, P2_Y - 24, "spread"],
    [5500, P2_Y - 24, "laser"],
    [7180, P3_Y - 24, "spread"],
    [8000, P2_Y - 24, "laser"],
  ],

  spikeTraps: [],

  sniperNests: [],

  laserGates: [
    [1760, P3_Y - 16, GROUND_TOP_Y - (P3_Y - 16), 2300],
    [4420, P2_Y - 36, GROUND_TOP_Y - (P2_Y - 36), 2100],
    [7360, P1_Y - 56, GROUND_TOP_Y - (P1_Y - 56), 1900],
  ],
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const LEVEL_DEFS: LevelDef[] = [level1, level2, level3];
