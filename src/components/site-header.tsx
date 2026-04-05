import Link from "next/link";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/games", label: "游戏库" },
  { href: "/play/tank-blitz", label: "立即开玩" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="neon-ring flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-cyan-200">
            RS
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-cyan-200/75 uppercase">
              Retro Game Station
            </p>
            <p className="text-xs text-muted">Next.js Arcade Hub</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-200/85 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-cyan-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
