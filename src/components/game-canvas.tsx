"use client";

import { useEffect, useId, useRef, useState } from "react";

type GameCanvasProps = {
  slug: string;
};

type FullscreenCapableDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

type FullscreenCapableElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getActiveFullscreenElement(doc: FullscreenCapableDocument) {
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function GameCanvas({ slug }: GameCanvasProps) {
  const containerId = useId().replace(/:/g, "");
  const gameRef = useRef<import("phaser").Game | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  useEffect(() => {
    const stage = stageRef.current as FullscreenCapableElement | null;

    if (!stage) {
      return;
    }

    const fullscreenDocument = document as FullscreenCapableDocument;
    const syncFullscreenState = () => {
      const activeElement = getActiveFullscreenElement(fullscreenDocument);
      setIsFullscreen(activeElement === stage);
    };

    setFullscreenSupported(Boolean(stage.requestFullscreen || stage.webkitRequestFullscreen));
    syncFullscreenState();

    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
    };
  }, []);

  async function handleFullscreenToggle() {
    const stage = stageRef.current as FullscreenCapableElement | null;

    if (!stage) {
      return;
    }

    const fullscreenDocument = document as FullscreenCapableDocument;
    const activeElement = getActiveFullscreenElement(fullscreenDocument);
    setFullscreenError(null);

    try {
      if (activeElement === stage) {
        const exitFullscreen =
          fullscreenDocument.exitFullscreen?.bind(fullscreenDocument) ??
          fullscreenDocument.webkitExitFullscreen?.bind(fullscreenDocument);

        if (!exitFullscreen) {
          setFullscreenSupported(false);
          return;
        }

        await Promise.resolve(exitFullscreen());
        return;
      }

      const requestFullscreen = stage.requestFullscreen?.bind(stage) ?? stage.webkitRequestFullscreen?.bind(stage);

      if (!requestFullscreen) {
        setFullscreenSupported(false);
        return;
      }

      await Promise.resolve(requestFullscreen());
    } catch {
      setFullscreenError("无法切换全屏，请检查浏览器权限后重试。");
    }
  }

  return (
    <div className="pixel-panel overflow-hidden rounded-[2rem] p-4">
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-slate-200/80">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p>Browser Arcade Runtime</p>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">960 x 640 / Phaser 3</p>
        </div>
        {fullscreenSupported ? (
          <button
            type="button"
            onClick={handleFullscreenToggle}
            aria-pressed={isFullscreen}
            className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/16 hover:text-white"
          >
            {isFullscreen ? "退出全屏" : "全屏"}
          </button>
        ) : null}
      </div>
      <div
        ref={stageRef}
        className={[
          "overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-[#050913]",
          isFullscreen
            ? "flex h-screen w-screen items-center justify-center rounded-none border-none bg-[#050913] p-0"
            : "p-2",
        ].join(" ")}
      >
        <div
          id={containerId}
          className="mx-auto aspect-[3/2] w-full"
          style={{
            maxWidth: isFullscreen ? "min(100vw, 150vh)" : "960px",
          }}
        />
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {fullscreenError ? <p className="mt-3 text-sm text-amber-200">{fullscreenError}</p> : null}
    </div>
  );
}
