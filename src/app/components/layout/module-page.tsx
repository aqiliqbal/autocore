"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

type Stat = {
  label: string;
  value: string;
  description: string;
};

type Row = {
  [key: string]: string;
};

type ModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  buttonText: string;
  stats: Stat[];
  columns: string[];
  data: Row[];
  searchPlaceholder: string;
  onButtonClick?: () => void;
  renderActions?: (row: Row) => React.ReactNode;
};

export default function ModulePage({
  eyebrow,
  title,
  description,
  buttonText,
  stats,
  columns,
  data,
  searchPlaceholder,
  onButtonClick,
  renderActions,
}: ModulePageProps) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
  const value = search.trim().toLowerCase();

  if (!value) {
    return data;
  }

  return data.filter((row) =>
    Object.values(row).some((item) =>
      String(item ?? "")
        .toLowerCase()
        .includes(value),
    ),
  );
}, [data, search]);

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
      {/* HEADER */}
      <section className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e5253f] shadow-[0_0_10px_rgba(229,37,63,0.8)]" />

              <p className="font-technical text-xs uppercase tracking-[0.25em] text-[#e5253f]">
                AutoCore / {eyebrow}
              </p>
            </div>

            <h1 className="font-display text-5xl tracking-wide text-white lg:text-6xl">
              {title}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onButtonClick}
            className="btn-red rounded-xl px-5 py-3 text-sm font-semibold"
          >
            + {buttonText}
          </button>
        </div>
      </section>

      {/* STATS */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="interactive-surface rounded-2xl border border-white/8 bg-[#0e1117] p-5"
          >
            <p className="font-technical text-[10px] uppercase tracking-[0.16em] text-zinc-600">
              {stat.label}
            </p>

            <div className="mt-2 flex items-center justify-between">
              <p className="font-technical text-3xl font-semibold text-white">
                {stat.value}
              </p>

              {index % 2 === 0 ? (
                <ArrowUpRight
                  size={19}
                  className="text-[#35c98a]"
                />
              ) : (
                <ArrowDownRight
                  size={19}
                  className="text-[#e5253f]"
                />
              )}
            </div>

            <p className="mt-1 text-xs text-zinc-600">
              {stat.description}
            </p>
          </div>
        ))}
      </section>

      {/* SEARCH */}
      <section className="mb-5 rounded-2xl border border-white/8 bg-[#0e1117] p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#e5253f]/50"
          />
        </div>
      </section>

      {/* TABLE */}
      <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0e1117]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-white/8 bg-white/[0.02]">
              <tr className="font-technical text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                {columns.map((column) => (
                  <th key={column} className="px-5 py-4">
                    {column}
                  </th>
                ))}

                <th className="px-5 py-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-white/6 transition hover:bg-white/[0.025]"
                >
                  {columns.map((column) => {
                    const value = row[column];

                    return (
                      <td
                        key={column}
                        className="px-5 py-4 text-sm text-zinc-300"
                      >
                        {value}
                      </td>
                    );
                  })}

                  <td className="px-5 py-4 text-right">
                    {renderActions ? (
                      renderActions(row)
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-[#e5253f]/30 hover:text-white"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="flex min-h-[250px] flex-col items-center justify-center">
            <Search size={30} className="text-zinc-700" />

            <h3 className="mt-4 font-technical text-lg text-white">
              No records found
            </h3>

            <p className="mt-2 text-sm text-zinc-600">
              Try changing your search.
            </p>
          </div>
        )}

        <div className="border-t border-white/8 px-5 py-4 text-xs text-zinc-600">
          Showing {filteredData.length} records
        </div>
      </section>
    </div>
  );
}