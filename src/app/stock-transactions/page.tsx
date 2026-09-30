"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/dashboard-layout";

type TransactionType =
  | "PURCHASE_IN"
  | "SALE_OUT"
  | "CUSTOMER_RETURN"
  | "SUPPLIER_RETURN"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

type StockTransaction = {
  id: string;

  type: TransactionType;

  quantity: number;

  balanceAfter: number | null;

  referenceNote: string | null;

  createdAt: string;

  part: {
    id: string;
    partNumber: string;
    name: string;
    imageUrl: string | null;
  };

  location: {
    id: string;
    code: string;
    name: string;
    zone: string | null;
  };

  inventory: {
    id: string;
    quantity: number;
    reservedQuantity: number;
  };

  user: {
    id: string;
    fullName: string;
    email: string;
  } | null;

  purchase: {
    id: string;
    purchaseNumber: string;
  } | null;

  sale: {
    id: string;
    invoiceNumber: string;
  } | null;
};

const transactionLabels: Record<
  TransactionType,
  string
> = {
  PURCHASE_IN: "Purchase In",
  SALE_OUT: "Sale Out",
  CUSTOMER_RETURN: "Customer Return",
  SUPPLIER_RETURN: "Supplier Return",
  ADJUSTMENT_IN: "Adjustment In",
  ADJUSTMENT_OUT: "Adjustment Out",
  TRANSFER_IN: "Transfer In",
  TRANSFER_OUT: "Transfer Out",
};

const transactionColors: Record<
  TransactionType,
  string
> = {
  PURCHASE_IN:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

  SALE_OUT:
    "border-red-500/20 bg-red-500/10 text-red-400",

  CUSTOMER_RETURN:
    "border-blue-500/20 bg-blue-500/10 text-blue-400",

  SUPPLIER_RETURN:
    "border-orange-500/20 bg-orange-500/10 text-orange-400",

  ADJUSTMENT_IN:
    "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",

  ADJUSTMENT_OUT:
    "border-purple-500/20 bg-purple-500/10 text-purple-400",

  TRANSFER_IN:
    "border-green-500/20 bg-green-500/10 text-green-400",

  TRANSFER_OUT:
    "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
};

function isIncoming(type: TransactionType) {
  return (
    type === "PURCHASE_IN" ||
    type === "CUSTOMER_RETURN" ||
    type === "ADJUSTMENT_IN" ||
    type === "TRANSFER_IN"
  );
}

export default function StockTransactionsPage() {
  const [transactions, setTransactions] =
    useState<StockTransaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  async function loadTransactions() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/stock-transactions"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load stock transactions."
        );
      }

      setTransactions(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load stock transactions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    const cleanSearch =
      search.trim().toLowerCase();

    return transactions.filter(
      (transaction) => {
        const matchesType =
          typeFilter === "ALL" ||
          transaction.type === typeFilter;

        if (!matchesType) {
          return false;
        }

        if (!cleanSearch) {
          return true;
        }

        return (
          transaction.part.name
            .toLowerCase()
            .includes(cleanSearch) ||
          transaction.part.partNumber
            .toLowerCase()
            .includes(cleanSearch) ||
          transaction.location.name
            .toLowerCase()
            .includes(cleanSearch) ||
          transaction.location.code
            .toLowerCase()
            .includes(cleanSearch) ||
          transaction.referenceNote
            ?.toLowerCase()
            .includes(cleanSearch)
        );
      }
    );
  }, [
    transactions,
    search,
    typeFilter,
  ]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] p-6 lg:p-8">

        {/* HEADER */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e5253f] shadow-[0_0_10px_rgba(229,37,63,0.8)]" />

            <p className="font-technical text-xs uppercase tracking-[0.25em] text-[#e5253f]">
              AutoCore / Management / Stock Transactions
            </p>
          </div>

          <h1 className="font-display text-5xl tracking-wide text-white lg:text-6xl">
            STOCK TRANSACTIONS
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Track every stock movement across your
            warehouses and parts inventory.
          </p>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* SUMMARY */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <SummaryCard
            label="Total Transactions"
            value={transactions.length}
          />

          <SummaryCard
            label="Incoming"
            value={
              transactions.filter((item) =>
                isIncoming(item.type)
              ).length
            }
          />

          <SummaryCard
            label="Outgoing"
            value={
              transactions.filter(
                (item) =>
                  !isIncoming(item.type)
              ).length
            }
          />

        </div>

        {/* MAIN CARD */}
        <section className="rounded-2xl border border-white/8 bg-[#0e1117]">

          {/* TOOLBAR */}
          <div className="border-b border-white/8 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex flex-1 flex-col gap-3 sm:flex-row">

                {/* SEARCH */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search part, location or reference..."
                    className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#e5253f]/50"
                  />
                </div>

                {/* TYPE */}
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                  className="h-11 rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white outline-none transition focus:border-[#e5253f]/50"
                >
                  <option value="ALL">
                    All Transaction Types
                  </option>

                  <option value="PURCHASE_IN">
                    Purchase In
                  </option>

                  <option value="SALE_OUT">
                    Sale Out
                  </option>

                  <option value="CUSTOMER_RETURN">
                    Customer Return
                  </option>

                  <option value="SUPPLIER_RETURN">
                    Supplier Return
                  </option>

                  <option value="ADJUSTMENT_IN">
                    Adjustment In
                  </option>

                  <option value="ADJUSTMENT_OUT">
                    Adjustment Out
                  </option>

                  <option value="TRANSFER_IN">
                    Transfer In
                  </option>

                  <option value="TRANSFER_OUT">
                    Transfer Out
                  </option>
                </select>

              </div>

              <button
                type="button"
                onClick={loadTransactions}
                className="h-11 rounded-xl border border-white/8 bg-white/[0.03] px-4 text-sm text-zinc-400 transition hover:border-white/15 hover:text-white"
              >
                Refresh
              </button>

            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-500">
                Loading stock transactions...
              </p>
            </div>
          ) : filteredTransactions.length ===
            0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03]">
                <span className="text-xl text-zinc-600">
                  ↕
                </span>
              </div>

              <h3 className="text-sm font-medium text-white">
                No stock transactions found
              </h3>

              <p className="mt-1 text-xs text-zinc-600">
                Transactions will appear here when
                stock is moved.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px]">

                <thead>
                  <tr className="border-b border-white/8 text-left">

                    <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                      Transaction
                    </th>

                    <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                      Part
                    </th>

                    <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                      Warehouse
                    </th>

                    <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                      Quantity
                    </th>

                    <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                      Balance
                    </th>

                    <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                      Reference
                    </th>

                    <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                      Date
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredTransactions.map(
                    (transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.02]"
                      >

                        {/* TRANSACTION */}
                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
                              transactionColors[
                                transaction.type
                              ]
                            }`}
                          >
                            {
                              transactionLabels[
                                transaction.type
                              ]
                            }
                          </span>

                        </td>

                        {/* PART */}
                        <td className="px-5 py-4">

                          <div>
                            <p className="text-sm font-medium text-white">
                              {
                                transaction.part
                                  .name
                              }
                            </p>

                            <p className="mt-1 font-mono text-[11px] text-zinc-600">
                              {
                                transaction.part
                                  .partNumber
                              }
                            </p>
                          </div>

                        </td>

                        {/* LOCATION */}
                        <td className="px-5 py-4">

                          <div>
                            <p className="text-sm text-zinc-300">
                              {
                                transaction
                                  .location
                                  .name
                              }
                            </p>

                            <p className="mt-1 font-mono text-[11px] text-zinc-600">
                              {
                                transaction
                                  .location
                                  .code
                              }

                              {transaction.location
                                .zone && (
                                <>
                                  {" "}
                                  /{" "}
                                  {
                                    transaction
                                      .location
                                      .zone
                                  }
                                </>
                              )}
                            </p>
                          </div>

                        </td>

                        {/* QUANTITY */}
                        <td className="px-5 py-4">

                          <span
                            className={`font-mono text-sm font-semibold ${
                              isIncoming(
                                transaction.type
                              )
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {isIncoming(
                              transaction.type
                            )
                              ? "+"
                              : "-"}
                            {transaction.quantity}
                          </span>

                        </td>

                        {/* BALANCE */}
                        <td className="px-5 py-4">

                          <span className="font-mono text-sm text-white">
                            {transaction.balanceAfter ??
                              transaction.inventory
                                .quantity}
                          </span>

                        </td>

                        {/* REFERENCE */}
                        <td className="max-w-[220px] px-5 py-4">

                          {transaction.purchase ? (
                            <p className="font-mono text-[11px] text-zinc-400">
                              {
                                transaction
                                  .purchase
                                  .purchaseNumber
                              }
                            </p>
                          ) : transaction.sale ? (
                            <p className="font-mono text-[11px] text-zinc-400">
                              {
                                transaction.sale
                                  .invoiceNumber
                              }
                            </p>
                          ) : (
                            <p className="truncate text-xs text-zinc-500">
                              {transaction.referenceNote ||
                                "—"}
                            </p>
                          )}

                        </td>

                        {/* DATE */}
                        <td className="whitespace-nowrap px-5 py-4">

                          <p className="text-xs text-zinc-400">
                            {formatDate(
                              transaction.createdAt
                            )}
                          </p>

                          {transaction.user && (
                            <p className="mt-1 text-[10px] text-zinc-700">
                              {
                                transaction.user
                                  .fullName
                              }
                            </p>
                          )}

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

          {/* FOOTER */}
          {!loading &&
            filteredTransactions.length >
              0 && (
              <div className="border-t border-white/8 px-5 py-4">
                <p className="text-xs text-zinc-600">
                  Showing{" "}
                  <span className="text-zinc-400">
                    {filteredTransactions.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-zinc-400">
                    {transactions.length}
                  </span>{" "}
                  transactions
                </p>
              </div>
            )}

        </section>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0e1117] p-5">
      <p className="font-technical text-[10px] uppercase tracking-[0.18em] text-zinc-600">
        {label}
      </p>

      <p className="mt-3 font-display text-3xl tracking-wide text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString(
    "en-PK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}