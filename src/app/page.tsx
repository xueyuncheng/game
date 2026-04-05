import Link from "next/link";
import { ArcadeCard } from "@/components/arcade-card";
import { GameShell } from "@/components/game-shell";
import { games } from "@/data/games";

export default function Home() {
  return (
    <GameShell>
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-20">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-4 py-2 text-sm text-cyan-100/90">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            浏览器街机站点原型已启动
          </div>

          <div className="space-y-6">
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              用 <span className="text-cyan-300">Next.js</span> 做一个支持手柄的复古游戏网站
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-200/80 sm:text-xl">
              网站层负责品牌、游戏库和排行榜，游戏层由 Phaser 驱动。第一阶段先交付一款可玩的坦克战原型，并为类魂斗罗玩法预留完整入口。
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/play/tank-blitz"
              className="inline-flex items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10 px-6 py-3 font-semibold text-cyan-50 shadow-[0_0_20px_rgba(89,243,255,0.12)] transition hover:border-cyan-200/55 hover:bg-cyan-300/16 hover:text-white"
            >
              直接试玩 Tank Blitz
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center justify-center rounded-full border border-white/12 px-6 py-3 font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/5"
            >
              浏览游戏库
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Controller", "支持浏览器 Gamepad API，自动识别手柄连接"],
              ["Arcade Shell", "游戏详情、启动页、网站视觉一次搭好"],
              ["MVP First", "先做坦克战 MVP，再迭代横版射击玩法"],
            ].map(([title, desc]) => (
              <div key={title} className="pixel-panel rounded-3xl p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                  {title}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200/80">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pixel-panel relative overflow-hidden rounded-[2rem] p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300" />
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
            Launch Plan
          </p>
          <div className="mt-6 space-y-5">
            {[
              "统一键盘 / 手柄输入层，保持游戏逻辑与设备解耦",
              "Tank Blitz 先提供可玩的防守与对战反馈",
              "Steel Commando 进入第二阶段，补跳跃、敌兵与 Boss",
              "后续接排行榜、账号、存档与活动运营位",
            ].map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl border border-white/8 bg-white/4 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-300/12 text-sm font-semibold text-cyan-200">
                  {index + 1}
                </div>
                <p className="text-sm leading-7 text-slate-200/80">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-16 lg:px-8 lg:pb-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
              Featured Games
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              当前站内游戏
            </h2>
          </div>
          <Link href="/games" className="text-sm text-cyan-200 transition hover:text-cyan-100">
            查看全部
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {games.map((game) => (
            <ArcadeCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </GameShell>
  );
}
