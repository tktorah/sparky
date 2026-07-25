"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/src/resources/icons";
import type { Dictionary } from "@/app/[lang]/dictionaries";

type HomePageProps = {
  dict: Dictionary;
};

export function HomePage({ dict }: HomePageProps) {
  const [query, setQuery] = useState("");
  const { home, tools } = dict;

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return tools;
    return tools.filter((tool) =>
      `${tool.title} ${tool.description}`.toLowerCase().includes(normalizedQuery)
    );
  }, [query, tools]);

  return (
    <>
      <section className="grid justify-items-center pb-10 pt-1 text-center md:pb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-white/75 px-4 py-2 text-sm font-extrabold text-blue-600 shadow-[0_10px_25px_-18px_rgba(37,99,235,0.5)] backdrop-blur-xl dark:bg-slate-800/75 dark:text-blue-400">
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m12 3 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8Z" />
          </svg>
          {home.badge}
        </div>
        <h1 className="mt-7 text-5xl font-extrabold leading-tight tracking-normal text-slate-800 dark:text-slate-100 md:text-7xl">
          {home.heading1}
          <br/>
          {home.heading2}
        </h1>
        <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-500 dark:text-slate-400 md:text-xl md:leading-9">
          {home.subheading}
        </p>
      </section>

      <section aria-labelledby="tools-title">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="tools-title"
              className="text-3xl font-extrabold tracking-normal text-slate-800 dark:text-slate-100"
            >
              {home.allTools}
            </h2>
          </div>
          <p className="font-bold text-slate-500 dark:text-slate-400">
            {filteredTools.length} {home.toolsAvailable}
          </p>
        </div>

        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredTools.map((tool) => (
              <a
                className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-blue-300/60 hover:shadow-[0_18px_55px_-34px_rgba(37,99,235,0.6)] dark:border-slate-700/80 dark:bg-slate-800/70"
                href={tool.href}
                key={tool.href}
              >
                <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/70 blur-2xl transition duration-500 group-hover:scale-125 dark:bg-slate-700/80" />
                <span
                  className={[
                    "mb-5 inline-grid h-14 w-14 place-items-center rounded-2xl shadow-sm transition duration-300 group-hover:rotate-3 group-hover:scale-110",
                    tool.accent,
                  ].join(" ")}
                >
                  <Icon name={tool.icon as Parameters<typeof Icon>[0]["name"]} className="h-7 w-7" />
                </span>
                <h3 className="relative mb-3 text-xl font-extrabold tracking-normal text-slate-800 transition dark:text-slate-100">
                  {tool.title}
                </h3>
                <p className="relative flex-1 text-[15px] leading-7 text-slate-500 dark:text-slate-400">
                  {tool.description}
                </p>
                <span className="relative mt-6 translate-x-[-12px] text-sm font-extrabold text-blue-600 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-blue-400">
                  {home.tryIt}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center font-bold text-slate-500 dark:text-slate-400">
            {home.noResults}
          </p>
        )}
      </section>
    </>
  );
}
