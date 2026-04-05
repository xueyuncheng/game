export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 py-8 text-sm text-muted">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <p>Retro Game Station built with Next.js, Phaser and Web Gamepad API.</p>
        <p>当前版本聚焦 PC 浏览器与手柄优先体验。</p>
      </div>
    </footer>
  );
}
