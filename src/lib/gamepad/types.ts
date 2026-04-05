export type InputAction =
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "shoot"
  | "altShoot"
  | "start";

export type InputSnapshot = Record<InputAction, boolean>;

export type GamepadState = {
  connected: boolean;
  id: string | null;
  mapping: GamepadMappingType | null;
  buttons: number;
  axes: number[];
  lastSeenAt: number | null;
};

export const emptyInputSnapshot = (): InputSnapshot => ({
  moveUp: false,
  moveDown: false,
  moveLeft: false,
  moveRight: false,
  shoot: false,
  altShoot: false,
  start: false,
});

export const emptyGamepadState = (): GamepadState => ({
  connected: false,
  id: null,
  mapping: null,
  buttons: 0,
  axes: [],
  lastSeenAt: null,
});
