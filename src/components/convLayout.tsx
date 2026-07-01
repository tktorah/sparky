import { ReactNode } from "react";

type ConvLayoutProps = {
  dark: boolean;
  menuOpen: boolean;
  header: ReactNode;
  sidebar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  onCloseMenu: () => void;
};

export function ConvLayout({
  dark,
  menuOpen,
  header,
  sidebar,
  footer,
  children,
  onCloseMenu,
}: ConvLayoutProps) {
  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_45%_12%,rgba(59,130,246,0.14),transparent_28rem),linear-gradient(135deg,#f8fbff_0%,#eef5ff_42%,#f8fafc_100%)] text-slate-800 dark:bg-[radial-gradient(circle_at_45%_12%,rgba(37,99,235,0.22),transparent_30rem),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)] dark:text-slate-100">
        {/* 모바일 오버레이 */}
        <div
          className={[
            "fixed inset-0 z-30 bg-slate-950/50 opacity-0 backdrop-blur-sm transition lg:hidden",
            menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none",
          ].join(" ")}
          onClick={onCloseMenu}
        />

        <div className="flex min-h-dvh">
          {sidebar}
          <div className="flex max-h-dvh min-w-0 flex-1 flex-col overflow-y-auto">
            {header}
            <main className="mx-auto w-full max-w-[1600px] px-4 py-12 md:px-8 md:py-18">
              {children}
            </main>
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}