"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Battery,
  Bell,
  CarFront,
  ChevronRight,
  CircleGauge,
  Fuel,
  Gauge,
  Package,
  ShoppingCart,
  Thermometer,
  Truck,
  Users,
  Warehouse,
  Wrench,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Sidebar from "./components/layout/sidebar";
import Topbar from "./components/layout/topbar";
import Speedometer3D from "./components/dashboard/Speedometer3D";

type ApiRecord = Record<string, any>;

type DashboardData = {
  parts: ApiRecord[];
  inventory: ApiRecord[];
  sales: ApiRecord[];
  customers: ApiRecord[];
  purchases: ApiRecord[];
  stockTransactions: ApiRecord[];
};

const emptyData: DashboardData = {
  parts: [],
  inventory: [],
  sales: [],
  customers: [],
  purchases: [],
  stockTransactions: [],
};

export default function Home() {
  const router = useRouter();

  const [ignitionOn, setIgnitionOn] =
    useState(false);

  const [data, setData] =
    useState<DashboardData>(emptyData);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const responses =
          await Promise.allSettled([
            fetch("/api/parts"),
            fetch("/api/inventory"),
            fetch("/api/sales"),
            fetch("/api/customers"),
            fetch("/api/purchases"),
            fetch("/api/stock-transactions"),
          ]);

        const results =
          await Promise.all(
            responses.map(
              async (result) => {
                if (
                  result.status ===
                    "fulfilled" &&
                  result.value.ok
                ) {
                  try {
                    return await result.value.json();
                  } catch {
                    return [];
                  }
                }

                return [];
              },
            ),
          );

        setData({
          parts: extractArray(
            results[0],
          ),

          inventory: extractArray(
            results[1],
          ),

          sales: extractArray(
            results[2],
          ),

          customers: extractArray(
            results[3],
          ),

          purchases: extractArray(
            results[4],
          ),

          stockTransactions:
            extractArray(
              results[5],
            ),
        });
      } catch (error) {
        console.error(
          "Failed to load dashboard:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  /*
   * TOTAL PARTS
   */

  const totalParts =
    data.parts.length;

  /*
   * LOW STOCK
   */

  const lowStockItems =
    useMemo(() => {
      return data.inventory
        .map((inventory) => {
          const part =
            inventory.part ||
            data.parts.find(
              (item) =>
                item.id ===
                inventory.partId,
            );

          const quantity =
            numberValue(
              inventory.quantity ??
                inventory.stock ??
                part?.quantity ??
                0,
            );

          const minimum =
            numberValue(
              inventory.minimumStock ??
                inventory.minStock ??
                inventory.reorderLevel ??
                part?.minimumStock ??
                part?.minStock ??
                part?.reorderLevel ??
                0,
            );

          return {
            ...inventory,
            part,
            quantity,
            minimum,
          };
        })
        .filter(
          (item) =>
            item.minimum > 0 &&
            item.quantity <=
              item.minimum,
        )
        .sort(
          (a, b) =>
            a.quantity -
            b.quantity,
        );
    }, [
      data.inventory,
      data.parts,
    ]);

  /*
   * FALLBACK LOW STOCK
   */

  const finalLowStock =
    useMemo(() => {
      if (
        lowStockItems.length >
        0
      ) {
        return lowStockItems;
      }

      return data.parts
        .map((part) => {
          const quantity =
            numberValue(
              part.quantity ??
                part.stock ??
                part.currentStock ??
                0,
            );

          const minimum =
            numberValue(
              part.minimumStock ??
                part.minStock ??
                part.reorderLevel ??
                0,
            );

          return {
            ...part,
            part,
            quantity,
            minimum,
          };
        })
        .filter(
          (item) =>
            item.minimum > 0 &&
            item.quantity <=
              item.minimum,
        )
        .sort(
          (a, b) =>
            a.quantity -
            b.quantity,
        );
    }, [
      lowStockItems,
      data.parts,
    ]);

  /*
   * TOTAL INVENTORY VALUE
   */

  const inventoryValue =
    useMemo(() => {
      return data.inventory.reduce(
        (total, inventory) => {
          const part =
            inventory.part ||
            data.parts.find(
              (item) =>
                item.id ===
                inventory.partId,
            );

          const quantity =
            numberValue(
              inventory.quantity ??
                inventory.stock ??
                0,
            );

          const costPrice =
            numberValue(
              part?.costPrice ??
                inventory.costPrice ??
                0,
            );

          return (
            total +
            quantity *
              costPrice
          );
        },
        0,
      );
    }, [
      data.inventory,
      data.parts,
    ]);

  /*
   * TODAY'S SALES
   */

  const todaysSales =
    useMemo(() => {
      return data.sales
        .filter((sale) =>
          isToday(
            sale.saleDate ??
              sale.createdAt,
          ),
        )
        .reduce(
          (total, sale) =>
            total +
            numberValue(
              sale.total ??
                sale.grandTotal ??
                sale.amount ??
                0,
            ),
          0,
        );
    }, [data.sales]);

  /*
   * TOTAL PURCHASES
   */

  const totalPurchases =
    useMemo(() => {
      return data.purchases.reduce(
        (
          total,
          purchase,
        ) =>
          total +
          numberValue(
            purchase.total ??
              purchase.grandTotal ??
              purchase.amount ??
              purchase.subtotal ??
              0,
          ),
        0,
      );
    }, [data.purchases]);

  /*
   * STOCK IN
   */

  const stockIn =
    useMemo(() => {
      return data.stockTransactions
        .filter((transaction) =>
          isStockIn(
            transaction.type,
          ),
        )
        .reduce(
          (
            total,
            transaction,
          ) =>
            total +
            Math.abs(
              numberValue(
                transaction.quantity,
              ),
            ),
          0,
        );
    }, [
      data.stockTransactions,
    ]);

  /*
   * STOCK OUT
   */

  const stockOut =
    useMemo(() => {
      return data.stockTransactions
        .filter((transaction) =>
          isStockOut(
            transaction.type,
          ),
        )
        .reduce(
          (
            total,
            transaction,
          ) =>
            total +
            Math.abs(
              numberValue(
                transaction.quantity,
              ),
            ),
          0,
        );
    }, [
      data.stockTransactions,
    ]);

  /*
   * RECENT SALES
   */

  const recentSales =
    useMemo(() => {
      return [...data.sales]
        .sort(
          (a, b) =>
            dateValue(
              b.saleDate ??
                b.createdAt,
            ) -
            dateValue(
              a.saleDate ??
                a.createdAt,
            ),
        )
        .slice(0, 5);
    }, [data.sales]);

  /*
   * INVENTORY CATEGORIES
   */

  const inventoryCategories =
    useMemo(() => {
      const categories = [
        {
          name: "Engine Parts",
          keywords: ["engine"],
          icon: Gauge,
        },

        {
          name: "Brake System",
          keywords: ["brake"],
          icon: CircleGauge,
        },

        {
          name: "Electrical",
          keywords: [
            "electrical",
            "ignition",
            "battery",
            "coil",
            "sensor",
          ],
          icon: Zap,
        },

        {
          name: "Suspension",
          keywords: [
            "suspension",
            "shock",
            "strut",
          ],
          icon: Activity,
        },
      ];

      return categories.map(
        (category) => {
          const matchingParts =
            data.parts.filter(
              (part) => {
                const text =
                  `${part.name ?? ""} ${
                    part.category ??
                    ""
                  } ${
                    part.type ?? ""
                  }`.toLowerCase();

                return category.keywords.some(
                  (keyword) =>
                    text.includes(
                      keyword,
                    ),
                );
              },
            );

          const count =
            matchingParts.reduce(
              (total, part) =>
                total +
                numberValue(
                  part.quantity ??
                    part.stock ??
                    part.currentStock ??
                    0,
                ),
              0,
            );

          return {
            ...category,

            count,

            percentage:
              totalParts > 0
                ? Math.min(
                    Math.round(
                      (matchingParts.length /
                        totalParts) *
                        100,
                    ),
                    100,
                  )
                : 0,
          };
        },
      );
    }, [
      data.parts,
      totalParts,
    ]);

  return (
    <div className="min-h-screen bg-[#07080b] text-white">

      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN CONTENT */}

      <div className="ml-[255px] min-h-screen">

        <Topbar />

        <main className="px-8 py-8">

          {/* PAGE HEADER */}

          <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

            <div>

              <p className="font-technical text-xs font-semibold uppercase tracking-[0.3em] text-[#e5253f]">
                Control Center / Overview
              </p>

              <h1 className="font-display mt-2 text-5xl uppercase tracking-wide text-white">
                Automotive Operations
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                Monitor inventory,
                vehicle compatibility,
                sales activity and
                workshop operations
                from one control
                center.
              </p>

            </div>

            {/* ACTION BUTTONS */}

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/purchases/add",
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#101319] px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/15 hover:text-white"
              >
                <Truck size={16} />

                New Purchase
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/sales/add",
                  )
                }
                className="btn-red flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                <ShoppingCart
                  size={16}
                />

                New Sale
              </button>

            </div>

          </section>

          {/* =====================================================
              VEHICLE / SPEEDOMETER SECTION
          ===================================================== */}

          <section className="technical-grid relative mb-8 overflow-hidden rounded-2xl border border-white/8 bg-[#0c0f14]">

            {/* GLOBAL SECTION GLOW */}

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(229,37,63,0.08),transparent_45%)]" />

            <div className="relative grid min-h-[430px] grid-cols-1 xl:grid-cols-[1fr_1.3fr_1fr]">

              {/* =================================================
                  LEFT VEHICLE INFORMATION
              ================================================= */}

              <div className="relative z-20 flex flex-col justify-center border-b border-white/6 bg-[#0b0d12]/80 p-8 xl:border-b-0 xl:border-r">

                <div className="mb-8">

                  <div className="mb-3 flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-[#35c98a] shadow-[0_0_10px_rgba(53,201,138,0.8)]" />

                    <span className="font-technical text-xs uppercase tracking-[0.2em] text-emerald-400">
                      Vehicle Connected
                    </span>

                  </div>

                  <h2 className="font-display text-4xl tracking-wide">
                    BMW M3 G80
                  </h2>

                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-600">
                    S58 Twin-Turbo /
                    2024
                  </p>

                </div>

                <div className="space-y-5">

                  <VehicleMetric
                    icon={
                      <Thermometer
                        size={17}
                      />
                    }
                    label="Engine Temperature"
                    value="87°C"
                    percentage={72}
                  />

                  <VehicleMetric
                    icon={
                      <Fuel size={17} />
                    }
                    label="Fuel Level"
                    value="68%"
                    percentage={68}
                  />

                  <VehicleMetric
                    icon={
                      <Battery
                        size={17}
                      />
                    }
                    label="Battery Voltage"
                    value="13.8V"
                    percentage={84}
                  />

                </div>

              </div>

              {/* =================================================
                  SPEEDOMETER CENTER
                  
                  IMPORTANT:
                  The BMW background is ONLY inside this column.
              ================================================= */}

              <div className="relative isolate min-h-[430px] overflow-hidden border-b border-white/6 xl:border-b-0">

                {/* BMW IMAGE ONLY INSIDE CENTER COLUMN */}

                <img
                  src="https://c4.wallpaperflare.com/wallpaper/11/813/287/bmw-bmw-m3-g80-car-hd-wallpaper-preview.jpg"
                  alt="BMW M3 G80 background"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.28]"
                />

                {/* DARK CENTER OVERLAY */}

                <div className="pointer-events-none absolute inset-0 bg-[#07080b]/55" />

                {/* LEFT / RIGHT EDGE FADE */}

                <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0c0f14] to-transparent" />

                <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0c0f14] to-transparent" />

                {/* TOP FADE */}

                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0c0f14]/90 to-transparent" />

                {/* BOTTOM FADE */}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0c0f14]/90 to-transparent" />

                {/* RED AMBIENT GLOW */}

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(229,37,63,0.15),transparent_55%)]" />

                {/* TECHNICAL GRID */}

                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
                    backgroundSize:
                      "32px 32px",
                  }}
                />

                {/* SPEEDOMETER CONTENT */}

                <div className="relative z-20 flex min-h-[430px] items-center justify-center p-6">

                  <div className="relative w-full max-w-[430px]">

                    {/* SPEEDOMETER */}

                    <Speedometer3D
                      ignitionOn={
                        ignitionOn
                      }
                    />

                    {/* ENGINE BUTTON */}

                    <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          setIgnitionOn(
                            !ignitionOn,
                          )
                        }
                        className={`flex items-center gap-2 rounded-full border px-5 py-2.5 font-technical text-xs font-bold uppercase tracking-[0.15em] transition-all ${
                          ignitionOn
                            ? "border-[#e5253f]/50 bg-[#e5253f]/10 text-[#ff334d] shadow-[0_0_25px_rgba(229,37,63,0.2)]"
                            : "border-white/10 bg-[#101319]/95 text-zinc-400 hover:border-[#e5253f]/40 hover:text-white"
                        }`}
                      >

                        <span
                          className={`h-2 w-2 rounded-full ${
                            ignitionOn
                              ? "animate-pulse bg-[#ff334d]"
                              : "bg-zinc-600"
                          }`}
                        />

                        {ignitionOn
                          ? "Ignition On"
                          : "Start Engine"}

                      </button>

                    </div>

                  </div>

                </div>

              </div>

              {/* =================================================
                  RIGHT VEHICLE INFORMATION
              ================================================= */}

              <div className="relative z-20 flex flex-col justify-center border-t border-white/6 bg-[#0b0d12]/80 p-8 xl:border-l xl:border-t-0">

                <div className="mb-7 flex items-center justify-between">

                  <div>

                    <p className="font-technical text-xs uppercase tracking-[0.2em] text-zinc-600">
                      Selected Vehicle
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      M3 Competition
                    </p>

                  </div>

                  <CarFront
                    className="text-[#e5253f]"
                    size={28}
                  />

                </div>

                <div className="rounded-xl border border-white/6 bg-black/40 p-5">

                  <div className="mb-4 flex items-center justify-between">

                    <span className="text-xs uppercase tracking-wider text-zinc-600">
                      Vehicle Health
                    </span>

                    <span className="font-technical text-lg font-bold text-emerald-400">
                      94%
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">

                    <div className="h-full w-[94%] rounded-full bg-emerald-400" />

                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">

                    <VehicleInfo
                      label="Mileage"
                      value="12,450 KM"
                    />

                    <VehicleInfo
                      label="Engine"
                      value="S58B30T0"
                    />

                    <VehicleInfo
                      label="Transmission"
                      value="8-Speed M"
                    />

                    <VehicleInfo
                      label="Drive"
                      value="xDrive"
                    />

                  </div>

                </div>

                <button
                  type="button"
                  className="mt-4 flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 text-xs text-zinc-500 transition hover:border-[#e5253f]/30 hover:text-white"
                >
                  View vehicle details

                  <ChevronRight
                    size={15}
                  />

                </button>

              </div>

            </div>

          </section>

          {/* =====================================================
              LIVE STAT CARDS
          ===================================================== */}

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Total Parts"
              value={
                loading
                  ? "..."
                  : totalParts.toLocaleString()
              }
              description="parts in catalog"
              icon={
                <Package size={20} />
              }
            />

            <StatCard
              title="Low Stock"
              value={
                loading
                  ? "..."
                  : finalLowStock.length.toString()
              }
              description="items need attention"
              icon={
                <Bell size={20} />
              }
              warning
            />

            <StatCard
              title="Inventory Value"
              value={
                loading
                  ? "..."
                  : formatCurrency(
                      inventoryValue,
                    )
              }
              description="current stock value"
              icon={
                <Warehouse
                  size={20}
                />
              }
            />

            <StatCard
              title="Today's Sales"
              value={
                loading
                  ? "..."
                  : formatCurrency(
                      todaysSales,
                    )
              }
              description="sales generated today"
              icon={
                <ShoppingCart
                  size={20}
                />
              }
              positive
            />

          </section>

          {/* =====================================================
              SECONDARY LIVE STATS
          ===================================================== */}

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Customers"
              value={
                loading
                  ? "..."
                  : data.customers.length.toLocaleString()
              }
              description="registered customers"
              icon={
                <Users size={20} />
              }
            />

            <StatCard
              title="Purchases"
              value={
                loading
                  ? "..."
                  : formatCurrency(
                      totalPurchases,
                    )
              }
              description="total purchase value"
              icon={
                <Truck size={20} />
              }
            />

            <StatCard
              title="Stock In"
              value={
                loading
                  ? "..."
                  : stockIn.toLocaleString()
              }
              description="units received"
              icon={
                <ArrowDownRight
                  size={20}
                />
              }
              positive
            />

            <StatCard
              title="Stock Out"
              value={
                loading
                  ? "..."
                  : stockOut.toLocaleString()
              }
              description="units issued"
              icon={
                <ArrowUpRight
                  size={20}
                />
              }
              warning
            />

          </section>

          {/* =====================================================
              SALES + INVENTORY
          ===================================================== */}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">

            {/* SALES */}

            <div className="rounded-2xl border border-white/8 bg-[#0e1117] p-6">

              <div className="mb-7 flex items-center justify-between">

                <div>

                  <p className="font-technical text-xs uppercase tracking-[0.2em] text-zinc-600">
                    Revenue Analytics
                  </p>

                  <h2 className="font-display mt-1 text-3xl tracking-wide">
                    Sales Activity
                  </h2>

                </div>

                <select className="rounded-lg border border-white/8 bg-[#151922] px-3 py-2 text-xs text-zinc-400 outline-none">

                  <option>
                    Last 7 Days
                  </option>

                  <option>
                    Last 30 Days
                  </option>

                  <option>
                    Last 90 Days
                  </option>

                </select>

              </div>

              <div className="flex h-[220px] items-end gap-3 border-b border-white/6 px-2">

                {[
                  42,
                  65,
                  48,
                  78,
                  58,
                  88,
                  72,
                  94,
                  67,
                  82,
                  76,
                  100,
                ].map(
                  (
                    height,
                    index,
                  ) => (
                    <div
                      key={index}
                      className="group flex h-full flex-1 items-end"
                    >

                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-[#8f1628] to-[#ff334d] opacity-70 transition-all duration-300 group-hover:opacity-100"
                        style={{
                          height: `${height}%`,
                        }}
                      />

                    </div>
                  ),
                )}

              </div>

              <div className="mt-4 flex justify-between px-2 text-[10px] uppercase tracking-wider text-zinc-700">

                <span>
                  Mon
                </span>

                <span>
                  Tue
                </span>

                <span>
                  Wed
                </span>

                <span>
                  Thu
                </span>

                <span>
                  Fri
                </span>

                <span>
                  Sat
                </span>

                <span>
                  Sun
                </span>

              </div>

            </div>

            {/* INVENTORY HEALTH */}

            <div className="rounded-2xl border border-white/8 bg-[#0e1117] p-6">

              <div className="mb-7">

                <p className="font-technical text-xs uppercase tracking-[0.2em] text-zinc-600">
                  Stock Distribution
                </p>

                <h2 className="font-display mt-1 text-3xl tracking-wide">
                  Inventory Health
                </h2>

              </div>

              <div className="space-y-5">

                {inventoryCategories.map(
                  (category) => {
                    const Icon =
                      category.icon;

                    return (
                      <div
                        key={
                          category.name
                        }
                      >

                        <div className="mb-2 flex items-center justify-between">

                          <div className="flex items-center gap-2">

                            <Icon
                              size={15}
                              className="text-[#e5253f]"
                            />

                            <span className="text-xs text-zinc-400">
                              {
                                category.name
                              }
                            </span>

                          </div>

                          <span className="font-technical text-xs text-zinc-500">
                            {
                              category.count
                            }{" "}
                            units
                          </span>

                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">

                          <div
                            className="h-full rounded-full bg-[#e5253f]"
                            style={{
                              width: `${category.percentage}%`,
                            }}
                          />

                        </div>

                      </div>
                    );
                  },
                )}

              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/inventory",
                  )
                }
                className="mt-7 flex w-full items-center justify-between border-t border-white/6 pt-5 text-xs text-zinc-500 transition hover:text-white"
              >
                Open inventory management

                <ChevronRight
                  size={15}
                />

              </button>

            </div>

          </section>

          {/* =====================================================
              RECENT TRANSACTIONS + LOW STOCK
          ===================================================== */}

          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">

            {/* RECENT TRANSACTIONS */}

            <div className="rounded-2xl border border-white/8 bg-[#0e1117] p-6">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <p className="font-technical text-xs uppercase tracking-[0.2em] text-zinc-600">
                    Sales Department
                  </p>

                  <h2 className="font-display mt-1 text-3xl tracking-wide">
                    Recent Transactions
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/sales",
                    )
                  }
                  className="text-xs text-[#e5253f] hover:text-[#ff334d]"
                >
                  View all
                </button>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[650px] text-left">

                  <thead>

                    <tr className="border-b border-white/6 text-[10px] uppercase tracking-[0.15em] text-zinc-600">

                      <th className="pb-3 font-medium">
                        Invoice
                      </th>

                      <th className="pb-3 font-medium">
                        Customer
                      </th>

                      <th className="pb-3 font-medium">
                        Item
                      </th>

                      <th className="pb-3 font-medium">
                        Amount
                      </th>

                      <th className="pb-3 font-medium">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {recentSales.length ===
                    0 ? (
                      <tr>

                        <td
                          colSpan={5}
                          className="py-10 text-center text-xs text-zinc-600"
                        >
                          {loading
                            ? "Loading sales..."
                            : "No sales found."}
                        </td>

                      </tr>
                    ) : (
                      recentSales.map(
                        (
                          sale,
                          index,
                        ) => {

                          const customerName =
                            sale.customer
                              ?.name ??
                            sale.customerName ??
                            "Walk-in Customer";

                          const invoice =
                            sale.invoiceNumber ??
                            sale.saleNumber ??
                            `SALE-${index + 1}`;

                          const amount =
                            numberValue(
                              sale.total ??
                                sale.grandTotal ??
                                sale.amount ??
                                0,
                            );

                          const firstItem =
                            sale.items?.[0];

                          const itemName =
                            firstItem
                              ?.part
                              ?.name ??
                            firstItem?.partName ??
                            "Multiple Items";

                          const status =
                            sale.status ??
                            sale.paymentStatus ??
                            "COMPLETED";

                          return (
                            <tr
                              key={
                                sale.id ??
                                invoice
                              }
                              className="border-b border-white/4 text-xs transition hover:bg-white/[0.02]"
                            >

                              <td className="py-4 font-technical text-[#ff334d]">
                                #
                                {
                                  invoice
                                }
                              </td>

                              <td className="py-4 text-zinc-400">
                                {
                                  customerName
                                }
                              </td>

                              <td className="py-4 text-zinc-300">
                                {
                                  itemName
                                }
                              </td>

                              <td className="py-4 font-technical text-white">
                                {formatCurrency(
                                  amount,
                                )}
                              </td>

                              <td className="py-4">

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-wider ${
                                    String(
                                      status,
                                    ).toUpperCase() ===
                                    "COMPLETED"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-amber-500/10 text-amber-400"
                                  }`}
                                >
                                  {String(
                                    status,
                                  ).replace(
                                    "_",
                                    " ",
                                  )}
                                </span>

                              </td>

                            </tr>
                          );
                        },
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* LOW STOCK */}

            <div className="rounded-2xl border border-white/8 bg-[#0e1117] p-6">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <p className="font-technical text-xs uppercase tracking-[0.2em] text-zinc-600">
                    Inventory Alert
                  </p>

                  <h2 className="font-display mt-1 text-3xl tracking-wide">
                    Low Stock
                  </h2>

                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e5253f]/10 text-[#ff334d]">

                  <Bell size={17} />

                </div>

              </div>

              <div className="space-y-3">

                {finalLowStock
                  .slice(0, 4)
                  .map(
                    (
                      item,
                      index,
                    ) => {

                      const part =
                        item.part ??
                        item;

                      const name =
                        part.name ??
                        "Unknown Part";

                      const sku =
                        part.partNumber ??
                        part.sku ??
                        part.code ??
                        "N/A";

                      return (
                        <div
                          key={part.id ?? index}
                          className="rounded-xl border border-white/6 bg-[#101319] p-4 transition hover:border-[#e5253f]/25"
                        >

                          <div className="flex items-start justify-between gap-4">

                            <div>

                              <p className="text-xs font-medium text-zinc-300">
                                {name}
                              </p>

                              <p className="mt-1 font-technical text-[10px] uppercase tracking-wider text-zinc-600">
                                {sku}
                              </p>

                            </div>

                            <span className="font-technical text-sm font-bold text-[#ff465c]">
                              {
                                item.quantity
                              }
                            </span>

                          </div>

                          <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-800">

                            <div
                              className="h-full rounded-full bg-[#ff465c]"
                              style={{
                                width: `${Math.min(
                                  item.minimum >
                                    0
                                    ? (item.quantity /
                                        item.minimum) *
                                        100
                                    : 0,
                                  100,
                                )}%`,
                              }}
                            />

                          </div>

                          <p className="mt-2 text-[9px] uppercase tracking-wider text-zinc-700">
                            Minimum stock:{" "}
                            {
                              item.minimum
                            }
                          </p>

                        </div>
                      );
                    },
                  )}

                {!loading &&
                  finalLowStock.length ===
                    0 && (
                    <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-5 text-center">

                      <Wrench
                        size={20}
                        className="mx-auto text-emerald-400"
                      />

                      <p className="mt-2 text-xs text-emerald-400">
                        Inventory levels
                        are healthy.
                      </p>

                    </div>
                  )}

              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/inventory",
                  )
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5253f]/20 bg-[#e5253f]/5 py-3 text-xs text-[#ff334d] transition hover:bg-[#e5253f]/10"
              >
                Restock inventory

                <ChevronRight
                  size={14}
                />

              </button>

            </div>

          </section>

          {/* =====================================================
              FOOTER
          ===================================================== */}

          <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-white/6 pt-5 text-[10px] uppercase tracking-[0.15em] text-zinc-700 md:flex-row">

            <span>
              AutoCore Automotive
              Management System
            </span>

            <span className="font-technical">

              System Status:{" "}

              <span className="text-emerald-500">
                Operational
              </span>

            </span>

          </footer>

        </main>

      </div>

    </div>
  );
}

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function extractArray(
  value: any,
): ApiRecord[] {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  if (
    value?.data &&
    Array.isArray(value.data)
  ) {
    return value.data;
  }

  if (
    value?.items &&
    Array.isArray(value.items)
  ) {
    return value.items;
  }

  if (
    value?.results &&
    Array.isArray(value.results)
  ) {
    return value.results;
  }

  return [];
}

function numberValue(
  value: any,
): number {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function dateValue(
  value: any,
): number {
  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isNaN(
    timestamp,
  )
    ? 0
    : timestamp;
}

function isToday(
  value: any,
): boolean {
  if (!value) {
    return false;
  }

  const date =
    new Date(value);

  const today =
    new Date();

  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate()
  );
}

function isStockIn(
  type: any,
): boolean {
  const value =
    String(
      type ?? "",
    ).toUpperCase();

  return (
    value.includes("IN") ||
    value.includes(
      "RECEIPT",
    ) ||
    value.includes(
      "PURCHASE",
    ) ||
    value.includes(
      "RETURN_IN",
    )
  );
}

function isStockOut(
  type: any,
): boolean {
  const value =
    String(
      type ?? "",
    ).toUpperCase();

  return (
    value.includes("OUT") ||
    value.includes("SALE") ||
    value.includes(
      "ISSUE",
    ) ||
    value.includes(
      "RETURN_OUT",
    )
  );
}

function formatCurrency(
  value: number,
): string {
  if (
    !Number.isFinite(value)
  ) {
    return "Rs. 0";
  }

  return `Rs. ${Math.round(
    value,
  ).toLocaleString()}`;
}

/* =========================================================
   VEHICLE METRIC
========================================================= */

function VehicleMetric({
  icon,
  label,
  value,
  percentage,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  percentage: number;
}) {
  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <div className="flex items-center gap-2 text-zinc-500">

          {icon}

          <span className="font-technical text-xs uppercase tracking-wider">
            {label}
          </span>

        </div>

        <span className="font-technical text-sm text-zinc-300">
          {value}
        </span>

      </div>

      <div className="h-1 overflow-hidden rounded-full bg-zinc-800">

        <div
          className="h-full rounded-full bg-[#e5253f]"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

/* =========================================================
   VEHICLE INFO
========================================================= */

function VehicleInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-[10px] uppercase text-zinc-600">
        {label}
      </p>

      <p className="mt-1 font-technical text-sm text-white">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  description,
  icon,
  positive,
  warning,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  positive?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="interactive-surface rounded-2xl border border-white/8 bg-[#0e1117] p-5">

      <div className="flex items-start justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5253f]/8 text-[#e5253f]">

          {icon}

        </div>

        {positive && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">

            <ArrowUpRight
              size={12}
            />

            LIVE

          </span>
        )}

        {warning && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400">

            <ArrowDownRight
              size={12}
            />

            ALERT

          </span>
        )}

      </div>

      <p className="mt-5 text-xs uppercase tracking-wider text-zinc-600">
        {title}
      </p>

      <p className="font-technical mt-1 text-3xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-zinc-700">
        {description}
      </p>

    </div>
  );
}