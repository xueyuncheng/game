import { MAX_LIVES, STEEL_COMMANDO_SLUG } from "@/games/steel-commando/config";
import { LEVEL_DEFS } from "@/games/steel-commando/level-data";

export type SteelCommandoProgress = {
  level: number;
  lives: number;
  score: number;
};

const STORAGE_KEY = `${STEEL_COMMANDO_SLUG}:progress`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeProgress(value: unknown): SteelCommandoProgress | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<SteelCommandoProgress>;
  if (
    !Number.isFinite(candidate.level)
    || !Number.isFinite(candidate.lives)
    || !Number.isFinite(candidate.score)
  ) {
    return null;
  }

  const levelValue = candidate.level;
  const livesValue = candidate.lives;
  const scoreValue = candidate.score;

  if (levelValue === undefined || livesValue === undefined || scoreValue === undefined) {
    return null;
  }

  const level = clamp(Math.floor(levelValue), 1, LEVEL_DEFS.length);
  const lives = clamp(Math.floor(livesValue), 1, MAX_LIVES);
  const score = Math.max(0, Math.floor(scoreValue));

  return { level, lives, score };
}

export function loadSteelCommandoProgress() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    const progress = normalizeProgress(parsed);
    if (!progress) {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    return progress;
  } catch {
    return null;
  }
}

export function saveSteelCommandoProgress(progress: SteelCommandoProgress) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgress(progress) ?? progress));
  } catch {
    // Ignore storage failures; gameplay should continue even when persistence is unavailable.
  }
}

export function clearSteelCommandoProgress() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures; gameplay should continue even when persistence is unavailable.
  }
}
