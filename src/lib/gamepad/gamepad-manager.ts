"use client";

import { emptyGamepadState, emptyInputSnapshot, type GamepadState, type InputSnapshot } from "@/lib/gamepad/types";

const DEADZONE = 0.28;

function pressed(button: GamepadButton | null | undefined) {
  return Boolean(button?.pressed || (button?.value ?? 0) > 0.5);
}

function axisNegative(value: number | undefined) {
  return (value ?? 0) < -DEADZONE;
}

function axisPositive(value: number | undefined) {
  return (value ?? 0) > DEADZONE;
}

function mapGamepad(gamepad: Gamepad): InputSnapshot {
  const horizontal = gamepad.axes[0] ?? 0;
  const vertical = gamepad.axes[1] ?? 0;
  const useHorizontalAxis = Math.abs(horizontal) > DEADZONE;
  const useVerticalAxis = Math.abs(vertical) > DEADZONE;

  return {
    moveUp: pressed(gamepad.buttons[12]) || (useVerticalAxis && axisNegative(vertical)),
    moveDown: pressed(gamepad.buttons[13]) || (useVerticalAxis && axisPositive(vertical)),
    moveLeft: pressed(gamepad.buttons[14]) || (useHorizontalAxis && axisNegative(horizontal)),
    moveRight: pressed(gamepad.buttons[15]) || (useHorizontalAxis && axisPositive(horizontal)),
    shoot: pressed(gamepad.buttons[0]) || pressed(gamepad.buttons[7]),
    altShoot: pressed(gamepad.buttons[1]) || pressed(gamepad.buttons[6]),
    start: pressed(gamepad.buttons[9]),
  };
}

function extractState(gamepad: Gamepad): GamepadState {
  return {
    connected: gamepad.connected,
    id: gamepad.id,
    mapping: gamepad.mapping,
    buttons: gamepad.buttons.length,
    axes: gamepad.axes.map((value) => Number(value.toFixed(2))),
    lastSeenAt: Date.now(),
  };
}

export class GamepadManager {
  private state: GamepadState = emptyGamepadState();

  poll() {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
      this.state = emptyGamepadState();
      return emptyInputSnapshot();
    }

    const [gamepad] = navigator.getGamepads().filter(Boolean) as Gamepad[];

    if (!gamepad) {
      this.state = emptyGamepadState();
      return emptyInputSnapshot();
    }

    this.state = extractState(gamepad);
    return mapGamepad(gamepad);
  }

  getState() {
    return this.state;
  }

  vibrate(duration = 120, weakMagnitude = 0.4, strongMagnitude = 0.8) {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
      return;
    }

    const [gamepad] = navigator.getGamepads().filter(Boolean) as Gamepad[];
    const actuator = gamepad?.vibrationActuator;

    if (!actuator || typeof actuator.playEffect !== "function") {
      return;
    }

    void actuator.playEffect("dual-rumble", {
      duration,
      startDelay: 0,
      weakMagnitude,
      strongMagnitude,
    });
  }
}

export const gamepadManager = new GamepadManager();
