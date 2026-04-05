"use client";

import { useEffect, useId, useRef, useState } from "react";

type GameCanvasProps = {
  slug: string;
};

export function GameCanvas({ slug }: GameCanvasProps) {
  const containerId = useId().replace(/:/g, "");
  const gameRef = useRef<import("phaser").Game | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const Phaser = await import("phaser");
        const { createGameConfig } = await import("@/games");
        if (!mounted) {
          return;
        }

        gameRef.current = new Phaser.Game(createGameConfig(slug, containerId));
      } catch {
        if (mounted) {
          setError("游戏引擎加载失败，请刷新页面后重试。");
        }
      }
    }

    boot();

    return () => {
      mounted = false;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [containerId, slug]);

  return (
    <div className="pixel-panel overflow-hidden rounded-[2rem] p-4">
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-slate-200/80">
        <p>Browser Arcade Runtime</p>
        <p>960 x 640 / Phaser 3</p>
      </div>
      <div className="overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-[#050913] p-2">
        <div id={containerId} className="mx-auto aspect-[3/2] w-full max-w-[960px]" />
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
