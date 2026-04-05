"use client";

import { create } from "zustand";
import { emptyGamepadState, emptyInputSnapshot, type GamepadState, type InputSnapshot } from "@/lib/gamepad/types";

type GamepadStore = {
  state: GamepadState;
  input: InputSnapshot;
  setSnapshot: (payload: { state: GamepadState; input: InputSnapshot }) => void;
  reset: () => void;
};

export const useGamepadStore = create<GamepadStore>((set) => ({
  state: emptyGamepadState(),
  input: emptyInputSnapshot(),
  setSnapshot: ({ state, input }) => set({ state, input }),
  reset: () =>
    set({
      state: emptyGamepadState(),
      input: emptyInputSnapshot(),
    }),
}));
