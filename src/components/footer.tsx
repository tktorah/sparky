"use client";

type FooterDict = {
  privacy: string;
  terms: string;
  contact: string;
};

type FooterProps = {
  dict: FooterDict;
};

export function Footer({ dict }: FooterProps) {
  return (
    <footer className="border-t border-slate-200/80 bg-white/50 px-4 py-6 text-sm font-bold text-slate-500 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/20 dark:text-slate-400 md:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <span>© 2026 DevTora</span>
        <nav className="flex flex-wrap gap-6 text-xs font-extrabold uppercase tracking-wider">
          <a className="transition hover:text-blue-500" href="#">
            {dict.privacy}
          </a>
          <a className="transition hover:text-blue-500" href="#">
            {dict.terms}
          </a>
          <a className="transition hover:text-blue-500" href="#">
            {dict.contact}
          </a>
        </nav>
      </div>
    </footer>
  );
}