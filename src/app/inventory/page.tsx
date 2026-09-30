"use client";

import DashboardLayout from "../components/layout/dashboard-layout";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Eye,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type InventoryRecord = {
  id: string;
  quantity: number;
  reservedQuantity: number;
  part: {
    id: string;
    partNumber: string;
    oemNumber: string | null;
    name: string;
    category: {
      name: string;
    };
    costPrice: string | number;
    sellingPrice: string | number;
    minimumStock: number;
  };
  location: {
    code: string;
    name: string;
  };
};

type Part = {
  id: string;
  name: string;
  partNumber: string;
  category: string;
  vehicle: string;
  stock: number;
  minStock: number;
  location: string;
  supplier: string;
  buyPrice: number;
  sellPrice: number;
};

function getProfit(buyPrice: number, sellPrice: number) {
  return sellPrice - buyPrice;
}

function getMargin(buyPrice: number, sellPrice: number) {
  if (sellPrice === 0) {
    return 0;
  }

  return Math.round(
    ((sellPrice - buyPrice) / sellPrice) * 100
  );
}

export default function InventoryPage() {
  const router = useRouter();

  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [stockStatus, setStockStatus] = useState(
    "All Stock Status"
  );
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 7;

  useEffect(() => {
    async function loadInventory() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/inventory");

        if (!response.ok) {
          throw new Error("Failed to load inventory");
        }

        const data: InventoryRecord[] =
          await response.json();

        const formattedParts: Part[] = data.map(
          (item) => ({
            id: item.id,
            name: item.part.name,
            partNumber: item.part.partNumber,
            category: item.part.category.name,
            vehicle: "Compatibility available",
            stock: item.quantity,
            minStock: item.part.minimumStock,
            location: item.location.code,
            supplier: "Supplier data available",
            buyPrice: Number(item.part.costPrice),
            sellPrice: Number(item.part.sellingPrice),
          })
        );

        setParts(formattedParts);
      } catch (err) {
        console.error(
          "Failed to load inventory:",
          err
        );

        setError(
          "Unable to load inventory from database."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        parts.map((part) => part.category)
      )
    );

    return [
      "All Categories",
      ...uniqueCategories,
    ];
  }, [parts]);

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const searchText =
        search.toLowerCase().trim();

      const matchesSearch =
        part.name
          .toLowerCase()
          .includes(searchText) ||
        part.partNumber
          .toLowerCase()
          .includes(searchText) ||
        part.vehicle
          .toLowerCase()
          .includes(searchText) ||
        part.supplier
          .toLowerCase()
          .includes(searchText);

      const matchesCategory =
        category === "All Categories" ||
        part.category === category;

      let matchesStock = true;

      if (stockStatus === "In Stock") {
        matchesStock =
          part.stock > part.minStock;
      }

      if (stockStatus === "Low Stock") {
        matchesStock =
          part.stock > 0 &&
          part.stock <= part.minStock;
      }

      if (stockStatus === "Out of Stock") {
        matchesStock =
          part.stock === 0;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock
      );
    });
  }, [
    parts,
    search,
    category,
    stockStatus,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredParts.length / itemsPerPage
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const visibleParts =
    filteredParts.slice(
      (safePage - 1) * itemsPerPage,
      safePage * itemsPerPage
    );

  const totalParts = parts.length;

  const inStockCount = parts.filter(
    (part) =>
      part.stock > part.minStock
  ).length;

  const lowStockCount = parts.filter(
    (part) =>
      part.stock > 0 &&
      part.stock <= part.minStock
  ).length;

  const outOfStockCount = parts.filter(
    (part) =>
      part.stock === 0
  ).length;

  const inventoryStats = [
    {
      label: "Total Parts",
      value: totalParts.toLocaleString(),
      description:
        "Active inventory records",
      icon: Package,
    },
    {
      label: "In Stock",
      value:
        inStockCount.toLocaleString(),
      description:
        "Above minimum level",
      icon: ArrowUpRight,
    },
    {
      label: "Low Stock",
      value:
        lowStockCount.toLocaleString(),
      description:
        "Requires attention",
      icon: AlertTriangle,
    },
    {
      label: "Out of Stock",
      value:
        outOfStockCount.toLocaleString(),
      description:
        "Restock required",
      icon: ArrowDownToLine,
    },
  ];

  function handleSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleCategory(value: string) {
    setCategory(value);
    setCurrentPage(1);
  }

  function handleStockStatus(
    value: string
  ) {
    setStockStatus(value);
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearch("");
    setCategory("All Categories");
    setStockStatus(
      "All Stock Status"
    );
    setCurrentPage(1);
  }

  function handleAddPart() {
    router.push("/parts/add");
  }

  const hasFilters =
    search !== "" ||
    category !== "All Categories" ||
    stockStatus !==
      "All Stock Status";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px] p-6 lg:p-8">

        {/* PAGE HEADER */}
        <section className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e5253f] shadow-[0_0_10px_rgba(229,37,63,0.8)]" />

                <p className="font-technical text-xs uppercase tracking-[0.25em] text-[#e5253f]">
                  AutoCore / Inventory
                </p>
              </div>

              <h1 className="font-display text-5xl tracking-wide text-white lg:text-6xl">
                PARTS INVENTORY
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Manage automotive components,
                stock levels, warehouse locations,
                suppliers and pricing from one
                central workspace.
              </p>
            </div>

            {/* ADD PART BUTTON */}
            <button
              type="button"
              onClick={handleAddPart}
              className="btn-red flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
            >
              <Plus size={18} />
              Add New Part
            </button>

          </div>
        </section>

        {/* STATS */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {inventoryStats.map(
            (stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="interactive-surface group rounded-2xl border border-white/8 bg-[#0e1117] p-5"
                >
                  <div className="flex items-start justify-between">

                    <div>
                      <p className="font-technical text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                        {stat.label}
                      </p>

                      <p className="mt-2 font-technical text-3xl font-semibold text-white">
                        {stat.value}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {stat.description}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/6 bg-white/[0.03] text-zinc-500 transition group-hover:border-[#e5253f]/20 group-hover:text-[#ff334d]">
                      <Icon
                        size={19}
                        strokeWidth={1.8}
                      />
                    </div>

                  </div>
                </div>
              );
            }
          )}

        </section>

        {/* SEARCH + FILTERS */}
        <section className="mb-5 rounded-2xl border border-white/8 bg-[#0e1117] p-4">

          <div className="flex flex-col gap-3 xl:flex-row">

            {/* SEARCH */}
            <div className="relative flex-1">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  handleSearch(
                    event.target.value
                  )
                }
                placeholder="Search part name, OEM number, vehicle..."
                className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] pl-11 pr-10 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#e5253f]/50"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    handleSearch("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}

            </div>

            {/* CATEGORY */}
            <select
              value={category}
              onChange={(event) =>
                handleCategory(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-zinc-400 outline-none transition focus:border-[#e5253f]/50"
            >
              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            {/* STOCK */}
            <select
              value={stockStatus}
              onChange={(event) =>
                handleStockStatus(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-zinc-400 outline-none transition focus:border-[#e5253f]/50"
            >
              <option>
                All Stock Status
              </option>
              <option>
                In Stock
              </option>
              <option>
                Low Stock
              </option>
              <option>
                Out of Stock
              </option>
            </select>

            {/* MORE FILTERS */}
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-zinc-500 transition hover:border-white/15 hover:text-white"
            >
              <SlidersHorizontal
                size={16}
              />
              More Filters
            </button>

          </div>

          {/* ACTIVE FILTERS */}
          {hasFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/6 pt-4">

              <span className="text-xs text-zinc-600">
                Active filters:
              </span>

              {search && (
                <span className="rounded-lg border border-[#e5253f]/20 bg-[#e5253f]/5 px-2.5 py-1 text-xs text-[#ff334d]">
                  Search: {search}
                </span>
              )}

              {category !==
                "All Categories" && (
                <span className="rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                  {category}
                </span>
              )}

              {stockStatus !==
                "All Stock Status" && (
                <span className="rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                  {stockStatus}
                </span>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="ml-1 text-xs text-zinc-600 transition hover:text-[#ff334d]"
              >
                Clear all
              </button>

            </div>
          )}

        </section>

        {/* TABLE HEADER */}
        <div className="mb-3 flex items-center justify-between px-1">

          <div>
            <h2 className="font-technical text-sm font-semibold uppercase tracking-[0.15em] text-zinc-300">
              Inventory Records
            </h2>

            <p className="mt-1 text-xs text-zinc-600">
              Current warehouse stock and pricing
            </p>
          </div>

          <span className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-500">
            {filteredParts.length}{" "}
            matching records
          </span>

        </div>

        {/* TABLE */}
        <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0e1117]">

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

                <p className="font-technical text-sm uppercase tracking-wider text-zinc-500">
                  Loading inventory...
                </p>

              </div>

            </div>
          ) : error ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff465c]/20 bg-[#ff465c]/5 text-[#ff465c]">
                <AlertTriangle size={25} />
              </div>

              <h3 className="font-technical text-lg font-semibold text-white">
                Database connection error
              </h3>

              <p className="mt-2 max-w-md text-sm text-zinc-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2 text-xs text-zinc-400 transition hover:border-[#e5253f]/30 hover:text-white"
              >
                Retry
              </button>

            </div>
          ) : visibleParts.length > 0 ? (
            <>
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1250px] text-left">

                  <thead className="border-b border-white/8 bg-white/[0.02]">

                    <tr className="font-technical text-[10px] uppercase tracking-[0.16em] text-zinc-600">

                      <th className="px-5 py-4">
                        Part Information
                      </th>

                      <th className="px-5 py-4">
                        Category
                      </th>

                      <th className="px-5 py-4">
                        Compatibility
                      </th>

                      <th className="px-5 py-4">
                        Stock
                      </th>

                      <th className="px-5 py-4">
                        Location
                      </th>

                      <th className="px-5 py-4">
                        Supplier
                      </th>

                      <th className="px-5 py-4">
                        Pricing
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {visibleParts.map(
                      (part) => {

                        const lowStock =
                          part.stock > 0 &&
                          part.stock <=
                            part.minStock;

                        const outOfStock =
                          part.stock === 0;

                        const profit =
                          getProfit(
                            part.buyPrice,
                            part.sellPrice
                          );

                        const margin =
                          getMargin(
                            part.buyPrice,
                            part.sellPrice
                          );

                        return (
                          <tr
                            key={part.id}
                            className="border-b border-white/6 transition hover:bg-white/[0.025]"
                          >

                            {/* PART */}
                            <td className="px-5 py-5">

                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-[#080a0e] text-zinc-600">
                                  <Package
                                    size={18}
                                  />
                                </div>

                                <div>

                                  <p className="font-medium text-white">
                                    {part.name}
                                  </p>

                                  <p className="mt-1 font-technical text-xs text-zinc-600">
                                    Part:{" "}
                                    {part.partNumber}
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* CATEGORY */}
                            <td className="px-5 py-5">

                              <span className="rounded-lg border border-white/8 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-400">
                                {part.category}
                              </span>

                            </td>

                            {/* COMPATIBILITY */}
                            <td className="px-5 py-5">

                              <p className="text-sm text-zinc-300">
                                {part.vehicle}
                              </p>

                              <p className="mt-1 text-[11px] text-zinc-600">
                                Vehicle compatibility
                              </p>

                            </td>

                            {/* STOCK */}
                            <td className="px-5 py-5">

                              <div className="flex items-center gap-2">

                                <span
                                  className={`font-technical text-sm font-bold ${
                                    outOfStock
                                      ? "text-[#ff465c]"
                                      : lowStock
                                        ? "text-[#f0a83a]"
                                        : "text-[#35c98a]"
                                  }`}
                                >
                                  {part.stock}
                                </span>

                                <span className="text-xs text-zinc-600">
                                  units
                                </span>

                              </div>

                              <div className="mt-2 h-1 w-20 overflow-hidden rounded-full bg-white/5">

                                <div
                                  className={`h-full rounded-full ${
                                    outOfStock
                                      ? "bg-[#ff465c]"
                                      : lowStock
                                        ? "bg-[#f0a83a]"
                                        : "bg-[#35c98a]"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      (part.stock /
                                        Math.max(
                                          part.minStock *
                                            4,
                                          1
                                        )) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                />

                              </div>

                              {outOfStock && (
                                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-[#ff465c]">
                                  Out of stock
                                </p>
                              )}

                              {lowStock && (
                                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-[#f0a83a]">
                                  Low stock
                                </p>
                              )}

                            </td>

                            {/* LOCATION */}
                            <td className="px-5 py-5">

                              <span className="font-technical rounded-md bg-white/[0.04] px-2 py-1 text-xs text-zinc-400">
                                {part.location}
                              </span>

                            </td>

                            {/* SUPPLIER */}
                            <td className="px-5 py-5 text-sm text-zinc-500">
                              {part.supplier}
                            </td>

                            {/* PRICING */}
                            <td className="px-5 py-5">

                              <p className="font-technical text-sm font-semibold text-white">
                                $
                                {part.sellPrice.toLocaleString()}
                              </p>

                              <p className="mt-1 text-[10px] text-zinc-600">
                                Buy $
                                {part.buyPrice.toLocaleString()}{" "}
                                ·{" "}
                                <span className="text-[#35c98a]">
                                  $
                                  {profit.toLocaleString()}{" "}
                                  profit
                                </span>
                              </p>

                              <p className="mt-1 text-[10px] text-zinc-600">
                                Margin{" "}
                                {margin}%
                              </p>

                            </td>

                            {/* ACTIONS */}
                            <td className="px-5 py-5">

                              <div className="flex justify-end gap-1">

                                <button
                                  type="button"
                                  title="View part"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/5 hover:text-white"
                                >
                                  <Eye size={15} />
                                </button>

                                <button
                                  type="button"
                                  title="Edit part"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/5 hover:text-[#ff334d]"
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  type="button"
                                  title="More actions"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/5 hover:text-white"
                                >
                                  <MoreHorizontal
                                    size={16}
                                  />
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {/* PAGINATION */}
              <div className="flex flex-col gap-3 border-t border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-xs text-zinc-600">

                  Showing{" "}

                  <span className="text-zinc-400">

                    {(safePage - 1) *
                      itemsPerPage +
                      1}
                    –
                    {Math.min(
                      safePage *
                        itemsPerPage,
                      filteredParts.length
                    )}

                  </span>{" "}

                  of{" "}

                  <span className="text-zinc-400">
                    {filteredParts.length}
                  </span>{" "}

                  matching parts

                </p>

                <div className="flex gap-2">

                  <button
                    type="button"
                    disabled={
                      safePage === 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-zinc-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Previous
                  </button>

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (_, index) =>
                      index + 1
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        page ===
                        safePage
                          ? "border-[#e5253f]/30 bg-[#e5253f]/10 text-[#ff334d]"
                          : "border-white/8 text-zinc-500 hover:border-white/15 hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={
                      safePage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-zinc-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Next
                  </button>

                </div>

              </div>
            </>
          ) : (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-zinc-600">
                <Search size={25} />
              </div>

              <h3 className="font-technical text-lg font-semibold text-white">
                No parts found
              </h3>

              <p className="mt-2 max-w-md text-sm text-zinc-600">
                No inventory records match
                your current search or
                filters. Try changing your
                search criteria.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2 text-xs text-zinc-400 transition hover:border-[#e5253f]/30 hover:text-white"
              >
                Clear filters
              </button>

            </div>
          )}

        </section>

        {/* DATABASE STATUS */}
        <div className="mt-5 flex items-center gap-2 text-xs text-zinc-600">

          <span className="h-1.5 w-1.5 rounded-full bg-[#35c98a] shadow-[0_0_8px_rgba(53,201,138,0.7)]" />

          Live inventory data from AutoCore database

        </div>

      </div>
    </DashboardLayout>
  );
}