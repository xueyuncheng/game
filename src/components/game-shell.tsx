import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type GameShellProps = {
  children: React.ReactNode;
};

export function GameShell({ children }: GameShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="scanlines pointer-events-none absolute inset-0 opacity-30" />
      <SiteHeader />
      <main className="relative z-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
