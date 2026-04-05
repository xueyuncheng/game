import Link from "next/link";
import { notFound } from "next/navigation";
import { ControlHint } from "@/components/control-hint";
import { GameShell } from "@/components/game-shell";
import { GamepadStatus } from "@/components/gamepad-status";
import { games, getGameBySlug } from "@/data/games";

type GameDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return (
    <GameShell>
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div className="pixel-panel rounded-[2rem] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
            {game.genre}
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">{game.name}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200/80">
            {game.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {game.features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-4 py-2 text-sm text-cyan-50/90"
              >
                {feature}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/8 bg-white/4 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">状态</p>
              <p className="mt-3 text-lg text-white">{game.status}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/4 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">玩家数</p>
              <p className="mt-3 text-lg text-white">{game.players}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/4 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">控制器</p>
              <p className="mt-3 text-lg text-white">{game.controller ? "支持" : "暂不支持"}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={`/play/${game.slug}`}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200"
            >
              进入游戏
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center justify-center rounded-full border border-white/12 px-6 py-3 font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/5"
            >
              返回游戏库
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <GamepadStatus />
          <ControlHint slug={game.slug} />
        </div>
      </section>
    </GameShell>
  );
}
