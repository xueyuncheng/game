import Link from "next/link";
import type { GameSummary } from "@/data/games";

type ArcadeCardProps = {
  game: GameSummary;
};

export function ArcadeCard({ game }: ArcadeCardProps) {
  return (
    <article className="pixel-panel overflow-hidden rounded-3xl">
      <div className={`h-2 bg-gradient-to-r ${game.accent}`} />
      <div className="flex h-full flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
              {game.genre}
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{game.name}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">{game.tagline}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            {game.status === "playable" ? "Playable" : "Prototype"}
          </span>
        </div>

        <p className="text-sm leading-7 text-slate-200/85">{game.description}</p>

        <div className="flex flex-wrap gap-2">
          {game.features.map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-xs text-cyan-100/90"
            >
              {feature}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 text-sm text-muted">
          <div className="space-y-1">
            <p>{game.players}</p>
            <p>{game.controller ? "Controller Ready" : "Keyboard Only"}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/games/${game.slug}`}
              className="rounded-full border border-white/12 px-4 py-2 text-white/90 transition hover:border-cyan-300/30 hover:bg-white/5"
            >
              查看详情
            </Link>
            <Link
              href={`/play/${game.slug}`}
              className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-200"
            >
              开始游戏
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
