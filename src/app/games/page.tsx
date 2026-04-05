import { ArcadeCard } from "@/components/arcade-card";
import { GameShell } from "@/components/game-shell";
import { games } from "@/data/games";

export default function GamesPage() {
  return (
    <GameShell>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-16 lg:px-8">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
            Game Library
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            街机游戏库
          </h1>
          <p className="text-lg leading-8 text-muted">
            当前先落地一款可玩的坦克原型，并为类魂斗罗玩法预留完整网站入口、详情页和手柄输入体系。
          </p>
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
