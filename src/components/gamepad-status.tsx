"use client";

import { useEffect } from "react";
import { gamepadManager } from "@/lib/gamepad/gamepad-manager";
import { useGamepadStore } from "@/store/gamepad-store";

export function GamepadStatus() {
  const { state, input, setSnapshot, reset } = useGamepadStore();

  useEffect(() => {
    let frameId = 0;

    const tick = () => {
      const nextInput = gamepadManager.poll();
      setSnapshot({ state: gamepadManager.getState(), input: nextInput });
      frameId = window.requestAnimationFrame(tick);
    };

    const onDisconnect = () => reset();

    frameId = window.requestAnimationFrame(tick);
    window.addEventListener("gamepaddisconnected", onDisconnect);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
    };
  }, [reset, setSnapshot]);

  return (
    <div className="pixel-panel rounded-3xl p-5 text-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
            Controller
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {state.connected ? "手柄已连接" : "等待手柄连接"}
          </h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            state.connected
              ? "bg-emerald-400/15 text-emerald-200"
              : "bg-white/8 text-white/70"
          }`}
        >
          {state.connected ? "Online" : "Offline"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-slate-200/75">
        <p>{state.id ?? "按任意手柄按键后，浏览器通常才会暴露设备。"}</p>
        <p>映射: {state.mapping || "unknown"}</p>
        <p>摇杆: {state.axes.length ? state.axes.join(" / ") : "-"}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-cyan-50/85 sm:grid-cols-4">
        {[
          ["UP", input.moveUp],
          ["DOWN", input.moveDown],
          ["LEFT", input.moveLeft],
          ["RIGHT", input.moveRight],
          ["A / RT", input.shoot],
          ["B / LT", input.altShoot],
          ["START", input.start],
        ].map(([label, active]) => (
          <div
            key={String(label)}
            className={`rounded-2xl border px-3 py-2 text-center ${
              active
                ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                : "border-white/8 bg-white/4 text-white/70"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
