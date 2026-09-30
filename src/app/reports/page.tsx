"use client";

import DashboardLayout from "../components/layout/dashboard-layout";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AnyObject = Record<string, any>;

function getArray(data: any): AnyObject[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.sales)) {
    return data.sales;
  }

  if (Array.isArray(data?.parts)) {
    return data.parts;
  }

  if (Array.isArray(data?.inventory)) {
    return data.inventory;
  }

  if (Array.isArray(data?.purchases)) {
    return data.purchases;
  }

  return [];
}

function toNumber(value: any): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getDate(value: any): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isCompletedSale(sale: AnyObject): boolean {
  const status = String(
    sale?.status ?? sale?.paymentStatus ?? "",
  ).toUpperCase();

  if (!status) {
    return true;
  }

  return (
    status === "COMPLETED" ||
    status === "PAID" ||
    status === "CONFIRMED"
  );
}

function getSaleDate(sale: AnyObject): Date | null {
  return getDate(
    sale?.saleDate ??
      sale?.createdAt ??
      sale?.date ??
      sale?.transactionDate,
  );
}

function getSaleItems(sale: AnyObject): AnyObject[] {
  if (Array.isArray(sale?.items)) {
    return sale.items;
  }

  if (Array.isArray(sale?.saleItems)) {
    return sale.saleItems;
  }

  return [];
}

function getItemQuantity(item: AnyObject): number {
  return toNumber(
    item?.quantity ??
      item?.qty ??
      item?.units ??
      0,
  );
}

function getItemRevenue(item: AnyObject): number {
  return toNumber(
    item?.lineTotal ??
      item?.total ??
      item?.amount ??
      item?.unitPrice * getItemQuantity(item),
  );
}

function getItemCost(item: AnyObject): number {
  const quantity = getItemQuantity(item);

  const unitCost = toNumber(
    item?.unitCost ??
      item?.costPrice ??
      item?.part?.costPrice ??
      item?.part?.purchasePrice ??
      0,
  );

  return unitCost * quantity;
}

function getCategoryName(item: AnyObject): string {
  const category =
    item?.part?.category ??
    item?.part?.categoryName ??
    item?.category ??
    item?.categoryName ??
    item?.part?.type ??
    "Other";

  if (typeof category === "object") {
    return String(
      category?.name ??
        category?.title ??
        "Other",
    );
  }

  return String(category || "Other");
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000) {
    return `Rs. ${(value / 1_000_000).toFixed(1)}M`;
  }

  if (absolute >= 1_000) {
    return `Rs. ${(value / 1_000).toFixed(1)}K`;
  }

  return `Rs. ${Math.round(value).toLocaleString()}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function getMonthLabel(date: Date): string {
  return date
    .toLocaleString("en-US", {
      month: "short",
    })
    .toUpperCase();
}

function getPreviousMonth(
  date: Date,
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    1,
  );
}

function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return 100;
  }

  return ((current - previous) / previous) * 100;
}

export default function ReportsPage() {
  const [sales, setSales] = useState<AnyObject[]>([]);
  const [parts, setParts] = useState<AnyObject[]>([]);
  const [inventory, setInventory] = useState<AnyObject[]>([]);
  const [purchases, setPurchases] = useState<AnyObject[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReportsData() {
      try {
        setLoading(true);
        setError("");

        const [
          salesResponse,
          partsResponse,
          inventoryResponse,
          purchasesResponse,
        ] = await Promise.all([
          fetch("/api/sales"),
          fetch("/api/parts"),
          fetch("/api/inventory"),
          fetch("/api/purchases"),
        ]);

        if (
          !salesResponse.ok ||
          !partsResponse.ok ||
          !inventoryResponse.ok ||
          !purchasesResponse.ok
        ) {
          throw new Error(
            "Failed to load report data.",
          );
        }

        const [
          salesData,
          partsData,
          inventoryData,
          purchasesData,
        ] = await Promise.all([
          salesResponse.json(),
          partsResponse.json(),
          inventoryResponse.json(),
          purchasesResponse.json(),
        ]);

        setSales(getArray(salesData));
        setParts(getArray(partsData));
        setInventory(getArray(inventoryData));
        setPurchases(getArray(purchasesData));
      } catch (err) {
        console.error(
          "Reports data error:",
          err,
        );

        setError(
          "Unable to load report data. Please refresh the page.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadReportsData();
  }, []);

  const reportData = useMemo(() => {
    const completedSales = sales.filter(
      isCompletedSale,
    );

    let revenue = 0;
    let profit = 0;
    let unitsSold = 0;

    completedSales.forEach((sale) => {
      const items = getSaleItems(sale);

      /*
       * Prefer calculating from sale items.
       * This gives us real revenue and profit
       * based on the actual sale records.
       */

      if (items.length > 0) {
        items.forEach((item) => {
          revenue += getItemRevenue(item);

          profit +=
            getItemRevenue(item) -
            getItemCost(item);

          unitsSold += getItemQuantity(item);
        });
      } else {
        /*
         * Fallback for sales that don't expose items.
         */

        revenue += toNumber(
          sale?.total ??
            sale?.grandTotal ??
            sale?.amount ??
            0,
        );

        profit += toNumber(
          sale?.profit ??
            sale?.grossProfit ??
            0,
        );

        unitsSold += toNumber(
          sale?.quantity ??
            sale?.units ??
            0,
        );
      }
    });

    /*
     * INVENTORY VALUE
     *
     * We first try the inventory records.
     * If inventory has no usable quantity,
     * we fall back to parts.
     */

    let inventoryValue = 0;

    inventory.forEach((item) => {
      const quantity = toNumber(
        item?.quantity ??
          item?.stock ??
          item?.currentStock ??
          item?.availableQuantity ??
          0,
      );

      const cost = toNumber(
        item?.unitCost ??
          item?.costPrice ??
          item?.part?.costPrice ??
          item?.part?.purchasePrice ??
          item?.part?.price ??
          0,
      );

      inventoryValue += quantity * cost;
    });

    /*
     * If inventory endpoint does not contain
     * usable records, calculate from parts.
     */

    if (
      inventory.length === 0 ||
      inventoryValue === 0
    ) {
      inventoryValue = 0;

      parts.forEach((part) => {
        const quantity = toNumber(
          part?.quantity ??
            part?.stock ??
            part?.currentStock ??
            part?.inventoryQuantity ??
            0,
        );

        const cost = toNumber(
          part?.costPrice ??
            part?.purchasePrice ??
            part?.unitCost ??
            part?.price ??
            0,
        );

        inventoryValue += quantity * cost;
      });
    }

    /*
     * LAST 6 MONTHS
     */

    const now = new Date();

    const months = Array.from(
      { length: 6 },
      (_, index) => {
        return new Date(
          now.getFullYear(),
          now.getMonth() - (5 - index),
          1,
        );
      },
    );

    const monthlySales = months.map(
      (month) => {
        const monthKey = getMonthKey(month);

        let value = 0;

        completedSales.forEach(
          (sale) => {
            const saleDate =
              getSaleDate(sale);

            if (!saleDate) {
              return;
            }

            if (
              getMonthKey(saleDate) !==
              monthKey
            ) {
              return;
            }

            const items =
              getSaleItems(sale);

            if (items.length > 0) {
              items.forEach((item) => {
                value += getItemRevenue(item);
              });
            } else {
              value += toNumber(
                sale?.total ??
                  sale?.grandTotal ??
                  sale?.amount ??
                  0,
              );
            }
          },
        );

        return {
          month: getMonthLabel(month),
          monthKey,
          value,
        };
      },
    );

    /*
     * CATEGORY PERFORMANCE
     */

    const categoryMap =
      new Map<string, number>();

    completedSales.forEach((sale) => {
      const items = getSaleItems(sale);

      items.forEach((item) => {
        const category =
          getCategoryName(item);

        const current =
          categoryMap.get(category) ?? 0;

        categoryMap.set(
          category,
          current + getItemRevenue(item),
        );
      });
    });

    const categoryEntries = Array.from(
      categoryMap.entries(),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const highestCategoryValue =
      categoryEntries.length > 0
        ? categoryEntries[0][1]
        : 0;

    const categories =
      categoryEntries.map(
        ([name, value]) => ({
          name,
          value,
          percentage:
            highestCategoryValue > 0
              ? Math.round(
                  (value /
                    highestCategoryValue) *
                    100,
                )
              : 0,
        }),
      );

    /*
     * CURRENT MONTH / PREVIOUS MONTH
     */

    const currentMonthStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      );

    const previousMonthStart =
      getPreviousMonth(now);

    const currentMonthKey =
      getMonthKey(currentMonthStart);

    const previousMonthKey =
      getMonthKey(previousMonthStart);

    let currentMonthRevenue = 0;
    let previousMonthRevenue = 0;

    completedSales.forEach((sale) => {
      const date = getSaleDate(sale);

      if (!date) {
        return;
      }

      const key = getMonthKey(date);

      const items = getSaleItems(sale);

      let saleRevenue = 0;

      if (items.length > 0) {
        items.forEach((item) => {
          saleRevenue +=
            getItemRevenue(item);
        });
      } else {
        saleRevenue = toNumber(
          sale?.total ??
            sale?.grandTotal ??
            sale?.amount ??
            0,
        );
      }

      if (key === currentMonthKey) {
        currentMonthRevenue +=
          saleRevenue;
      }

      if (key === previousMonthKey) {
        previousMonthRevenue +=
          saleRevenue;
      }
    });

    const revenueChange =
      calculatePercentageChange(
        currentMonthRevenue,
        previousMonthRevenue,
      );

    return {
      revenue,
      profit,
      inventoryValue,
      unitsSold,
      monthlySales,
      categories,
      revenueChange,
      currentMonthRevenue,
      previousMonthRevenue,
    };
  }, [
    sales,
    parts,
    inventory,
    purchases,
  ]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

            <p className="font-technical text-xs uppercase tracking-[0.2em] text-zinc-500">
              Loading business reports...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
            <p className="font-technical text-sm uppercase tracking-wider text-red-400">
              Report Error
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-5 rounded-lg bg-[#e5253f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#ff334d]"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const revenueChange =
    reportData.revenueChange;

  const revenueChangePositive =
    revenueChange >= 0;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px] p-6 lg:p-8">

        {/* HEADER */}

        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e5253f] shadow-[0_0_10px_rgba(229,37,63,0.8)]" />

            <p className="font-technical text-xs uppercase tracking-[0.25em] text-[#e5253f]">
              AutoCore / Reports
            </p>
          </div>

          <h1 className="font-display text-5xl tracking-wide text-white lg:text-6xl">
            BUSINESS REPORTS
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Real-time business analytics calculated from
            your sales, inventory and parts data.
          </p>
        </section>

        {/* KPI */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* REVENUE */}

          <div className="rounded-2xl border border-white/8 bg-[#0e1117] p-5">
            <CircleDollarSign
              className="text-[#35c98a]"
              size={20}
            />

            <p className="mt-4 text-[10px] uppercase tracking-wider text-zinc-600">
              Revenue
            </p>

            <p className="mt-1 font-technical text-3xl font-semibold text-white">
              {formatCompactCurrency(
                reportData.revenue,
              )}
            </p>

            <p
              className={`mt-2 flex items-center gap-1 text-xs ${
                revenueChangePositive
                  ? "text-[#35c98a]"
                  : "text-[#e5253f]"
              }`}
            >
              {revenueChangePositive ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}

              {Math.abs(
                revenueChange,
              ).toFixed(1)}
              % this month
            </p>
          </div>

          {/* PROFIT */}

          <div className="rounded-2xl border border-white/8 bg-[#0e1117] p-5">
            <TrendingUp
              className="text-[#e5253f]"
              size={20}
            />

            <p className="mt-4 text-[10px] uppercase tracking-wider text-zinc-600">
              Profit
            </p>

            <p className="mt-1 font-technical text-3xl font-semibold text-white">
              {formatCompactCurrency(
                reportData.profit,
              )}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Revenue minus item costs
            </p>
          </div>

          {/* INVENTORY */}

          <div className="rounded-2xl border border-white/8 bg-[#0e1117] p-5">
            <Package
              className="text-[#f0a83a]"
              size={20}
            />

            <p className="mt-4 text-[10px] uppercase tracking-wider text-zinc-600">
              Inventory Value
            </p>

            <p className="mt-1 font-technical text-3xl font-semibold text-white">
              {formatCompactCurrency(
                reportData.inventoryValue,
              )}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Current stock cost value
            </p>
          </div>

          {/* UNITS */}

          <div className="rounded-2xl border border-white/8 bg-[#0e1117] p-5">
            <BarChart3
              className="text-zinc-400"
              size={20}
            />

            <p className="mt-4 text-[10px] uppercase tracking-wider text-zinc-600">
              Units Sold
            </p>

            <p className="mt-1 font-technical text-3xl font-semibold text-white">
              {reportData.unitsSold.toLocaleString()}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Across completed sales
            </p>
          </div>

        </section>

        {/* MONTHLY SALES */}

        <section className="mt-6 rounded-2xl border border-white/8 bg-[#0e1117] p-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-technical text-sm font-semibold uppercase tracking-[0.15em] text-zinc-300">
                Monthly Sales
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Real revenue from the last six months
              </p>
            </div>

            <span className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-zinc-500">
              LIVE
            </span>
          </div>

          <div className="mt-8 flex h-[280px] items-end gap-4 border-b border-white/8 px-4">

            {reportData.monthlySales.map(
              (item) => {
                const maxValue = Math.max(
                  ...reportData.monthlySales.map(
                    (month) =>
                      month.value,
                  ),
                  1,
                );

                const height =
                  (item.value /
                    maxValue) *
                  210;

                return (
                  <div
                    key={item.monthKey}
                    className="group flex flex-1 flex-col items-center justify-end gap-3"
                  >
                    <span className="text-xs text-zinc-500 opacity-0 transition group-hover:opacity-100">
                      {formatCompactCurrency(
                        item.value,
                      )}
                    </span>

                    <div
                      className="w-full max-w-[70px] rounded-t-lg bg-[#e5253f]/70 transition-all duration-300 group-hover:bg-[#ff334d]"
                      style={{
                        height: `${Math.max(
                          height,
                          item.value > 0
                            ? 8
                            : 2,
                        )}px`,
                      }}
                    />

                    <span className="mb-3 font-technical text-[10px] text-zinc-600">
                      {item.month}
                    </span>
                  </div>
                );
              },
            )}

          </div>
        </section>

        {/* CATEGORY PERFORMANCE */}

        <section className="mt-6 rounded-2xl border border-white/8 bg-[#0e1117] p-6">

          <div className="mb-6">
            <h2 className="font-technical text-sm font-semibold uppercase tracking-[0.15em] text-zinc-300">
              Category Performance
            </h2>

            <p className="mt-1 text-xs text-zinc-600">
              Sales contribution calculated from actual
              sale items
            </p>
          </div>

          {reportData.categories.length === 0 ? (
            <div className="rounded-xl border border-white/6 bg-black/10 p-8 text-center">
              <p className="text-sm text-zinc-500">
                No category sales data available yet.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {reportData.categories.map(
                (category) => (
                  <div key={category.name}>

                    <div className="mb-2 flex justify-between">
                      <div>
                        <span className="text-sm text-zinc-300">
                          {category.name}
                        </span>

                        <span className="ml-3 text-xs text-zinc-600">
                          {formatCompactCurrency(
                            category.value,
                          )}
                        </span>
                      </div>

                      <span className="font-technical text-xs text-zinc-500">
                        {category.percentage}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-[#e5253f] transition-all duration-700"
                        style={{
                          width: `${category.percentage}%`,
                        }}
                      />
                    </div>

                  </div>
                ),
              )}
            </div>
          )}

        </section>

        {/* REPORT FOOTER */}

        <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-5">
          <p className="text-xs text-zinc-600">
            Report data is calculated from AutoCore
            database records.
          </p>

          <p className="font-technical text-[10px] uppercase tracking-wider text-emerald-500">
            ● Live Data
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}