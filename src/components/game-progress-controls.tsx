"use client";

import { useRouter } from "next/navigation";
import { clearSteelCommandoProgress } from "@/games/steel-commando/progress";

type GameProgressControlsProps = {
  slug: string;
};

export function GameProgressControls({ slug }: GameProgressControlsProps) {
  const router = useRouter();

  if (slug !== "steel-commando") {
    return null;
  }

  function handleResetProgress() {
    clearSteelCommandoProgress();
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-cyan-300/15 bg-slate-950/40 px-5 py-4 text-sm text-slate-200/75">
      <div>
        <p className="font-semibold uppercase tracking-[0.2em] text-cyan-100">本地进度</p>
        <p className="mt-1 text-slate-300/70">会自动保存在当前浏览器中，刷新页面后会继续当前关卡。</p>
      </div>
      <button
        type="button"
        onClick={handleResetProgress}
        className="rounded-full border border-rose-300/30 bg-rose-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100 transition hover:border-rose-200/60 hover:bg-rose-400/16 hover:text-white"
      >
        重置进度
      </button>
    </div>
  );
}
