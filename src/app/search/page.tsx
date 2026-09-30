"use client";

import {
  Search,
  Package,
  CarFront,
  Gauge,
  Users,
  Truck,
  ArrowRight,
} from "lucide-react";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
  useRouter,
} from "next/navigation";

type SearchResult = {
  id: string;
  type:
    | "Part"
    | "Vehicle"
    | "Engine"
    | "Customer"
    | "Supplier";
  title: string;
  subtitle: string;
  href: string;
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080b] text-white">
          <div className="mx-auto max-w-[1200px] px-8 py-10">
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/8 bg-[#0e1117]">
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

                Loading search...
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();

  const router = useRouter();

  const query =
    searchParams.get("q") ?? "";

  const [results, setResults] =
    useState<SearchResult[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function search() {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/global-search?q=${encodeURIComponent(
              query
            )}`
          );

        if (!response.ok) {
          throw new Error(
            "Search failed"
          );
        }

        const data =
          await response.json();

        setResults(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(error);

        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [query]);

  function getIcon(
    type: SearchResult["type"]
  ) {
    if (type === "Part") {
      return <Package size={22} />;
    }

    if (type === "Vehicle") {
      return <CarFront size={22} />;
    }

    if (type === "Engine") {
      return <Gauge size={22} />;
    }

    if (type === "Customer") {
      return <Users size={22} />;
    }

    return <Truck size={22} />;
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      <div className="mx-auto max-w-[1200px] px-8 py-10">

        {/* HEADER */}

        <div className="mb-8">
          <p className="font-technical text-xs uppercase tracking-[0.3em] text-[#e5253f]">
            AutoCore / Global Search
          </p>

          <h1 className="font-display mt-2 text-5xl uppercase tracking-wide">
            Search Results
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Results for{" "}
            <span className="text-white">
              "{query}"
            </span>
          </p>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/8 bg-[#0e1117]">
            <div className="flex items-center gap-3 text-sm text-zinc-500">

              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

              Searching AutoCore...

            </div>
          </div>

        ) : results.length === 0 ? (

          /* NO RESULTS */

          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/8 bg-[#0e1117] text-center">

            <Search
              size={35}
              className="text-zinc-700"
            />

            <h2 className="mt-4 font-technical text-lg text-white">
              No results found
            </h2>

            <p className="mt-2 text-sm text-zinc-600">
              Try searching for a part,
              OEM number, vehicle,
              engine, customer or supplier.
            </p>

          </div>

        ) : (

          /* RESULTS */

          <div className="space-y-3">

            {results.map(
              (result) => (

                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onClick={() =>
                    router.push(
                      result.href
                    )
                  }
                  className="group flex w-full items-center gap-5 rounded-2xl border border-white/8 bg-[#0e1117] p-5 text-left transition hover:border-[#e5253f]/30 hover:bg-[#11151c]"
                >

                  {/* ICON */}

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-[#151922] text-[#e5253f]">
                    {getIcon(
                      result.type
                    )}
                  </div>

                  {/* RESULT INFO */}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-3">

                      <h2 className="truncate text-sm font-semibold text-white">
                        {result.title}
                      </h2>

                      <span className="rounded-full bg-[#e5253f]/10 px-2 py-1 font-technical text-[9px] uppercase tracking-wider text-[#ff334d]">
                        {result.type}
                      </span>

                    </div>

                    <p className="mt-1 text-xs text-zinc-600">
                      {result.subtitle}
                    </p>

                  </div>

                  {/* ARROW */}

                  <ArrowRight
                    size={18}
                    className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-[#e5253f]"
                  />

                </button>

              )
            )}

          </div>

        )}

      </div>
    </div>
  );
}