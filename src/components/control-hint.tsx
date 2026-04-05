export function ControlHint() {
  return (
    <div className="pixel-panel rounded-3xl p-5 text-sm text-slate-200/80">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
        Controls
      </p>
      <div className="mt-4 space-y-3 leading-7">
        <p>键盘: `WASD` 或方向键移动，`Space` 开火，`Shift` 冲刺。</p>
        <p>手柄: 左摇杆 / 十字键移动，`A` 或右扳机开火，`B` 或左扳机冲刺，`Start` 重开。</p>
        <p>目标: 你自己中弹会直接结束游戏；基地也需要守住。砖墙可打穿，钢墙只能阻挡。</p>
      </div>
    </div>
  );
}
