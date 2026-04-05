type ControlHintProps = {
  slug: string;
};

export function ControlHint({ slug }: ControlHintProps) {
  const isSteelCommando = slug === "steel-commando";

  return (
    <div className="pixel-panel rounded-3xl p-5 text-sm text-slate-200/80">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
        Controls
      </p>
      <div className="mt-4 space-y-3 leading-7">
        <p>
          {isSteelCommando
            ? "键盘: `← →` 移动，`Z` 跳跃，`X` / `Ctrl` / `Space` 开火，`↑ ↓` 瞄准，配合左右可斜射。"
            : "键盘: `WASD` 或方向键移动，`Space` 开火，`Shift` 冲刺。"}
        </p>
        <p>
          {isSteelCommando
            ? "手柄: 左摇杆 / 十字键移动和瞄准，`A` 或右扳机开火，`B` 或左扳机跳跃，`Start` 重开。"
            : "手柄: 左摇杆 / 十字键移动，`A` 或右扳机开火，`B` 或左扳机冲刺，`Start` 重开。"}
        </p>
        <p>
          {isSteelCommando
            ? "目标: 推进关卡、拾取武器并清掉沿途敌人；现在支持八方向开火。"
            : "目标: 你自己中弹会直接结束游戏；基地也需要守住。砖墙可打穿，钢墙只能阻挡。"}
        </p>
      </div>
    </div>
  );
}
