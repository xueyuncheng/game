import { ArcadeCard } from "@/components/arcade-card";
import { GameShell } from "@/components/game-shell";
import { games } from "@/data/games";

export default function Home() {
  return (
    <GameShell>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-16 lg:px-8 lg:py-20">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">游戏列表</h1>

        <div className="grid gap-6 xl:grid-cols-2">
          {games.map((game) => (
            <ArcadeCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </GameShell>
  );
}
