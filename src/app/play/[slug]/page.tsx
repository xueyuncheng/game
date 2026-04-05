import Link from "next/link";
import { notFound } from "next/navigation";
import { ControlHint } from "@/components/control-hint";
import { GameCanvas } from "@/components/game-canvas";
import { GameProgressControls } from "@/components/game-progress-controls";
import { GameShell } from "@/components/game-shell";
import { GamepadStatus } from "@/components/gamepad-status";
import { games, getGameBySlug } from "@/data/games";

type PlayPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return (
    <GameShell>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
              Now Playing
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white">{game.name}</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-200/75">{game.tagline}</p>
          </div>
          <Link href={`/games/${game.slug}`} className="text-sm text-cyan-200 transition hover:text-cyan-100">
            查看游戏详情
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <GameCanvas slug={game.slug} />
          <div className="space-y-6">
            <GamepadStatus />
            <GameProgressControls slug={game.slug} />
            <ControlHint slug={game.slug} />
          </div>
        </div>
      </section>
    </GameShell>
  );
}
