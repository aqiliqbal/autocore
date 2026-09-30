"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  items: number;
};

export default function OrdersPage() {
  const [userEmail, setUserEmail] =
    useState("");

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadUser();
    loadOrders();
  }, []);

  /*
   * Load logged-in user.
   */
  async function loadUser() {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (user) {
        setUserEmail(
          user.email ?? ""
        );
      }
    } catch (error) {
      console.error(
        "Failed to load user:",
        error
      );
    }
  }

  /*
   * Load orders from DATABASE.
   */
  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch("/api/orders", {
          method: "GET",
          cache: "no-store",
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load orders."
        );
      }

      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error(
        "Failed to load orders:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Logout.
   */
  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href =
      "/login";
  }

  /*
   * Format order status.
   */
  function formatStatus(
    status: string
  ) {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  }

  /*
   * Format price.
   */
  function formatPrice(
    value: number
  ) {
    return value.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  return (
    <main className="min-h-screen bg-[#090b10] text-white">

      {/* ================= NAVBAR ================= */}

      <nav className="border-b border-white/10 bg-[#0d1016]">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* LOGO */}

          <Link
            href="/shop"
            className="text-2xl font-black"
          >
            AUTO
            <span className="text-[#e5253f]">
              CORE
            </span>
          </Link>

          {/* NAVIGATION */}

          <div className="flex items-center gap-4">

            <Link
              href="/shop"
              className="text-sm text-zinc-300 transition hover:text-white"
            >
              Shop
            </Link>

            <Link
              href="/orders"
              className="text-sm font-medium text-white"
            >
              My Orders
            </Link>

            <Link
              href="/cart"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              Cart
            </Link>

            {/* USER */}

            <div className="hidden text-right md:block">

              <p className="text-xs text-zinc-500">
                Signed in as
              </p>

              <p className="max-w-[180px] truncate text-sm text-white">
                {userEmail}
              </p>

            </div>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
            >
              Logout
            </button>

          </div>

        </div>

      </nav>


      {/* ================= HEADER ================= */}

      <section className="border-b border-white/10 bg-[#0b0e13]">

        <div className="mx-auto max-w-7xl px-6 py-12">

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e5253f]">
            AutoCore Store
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">

            <div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                My Orders
              </h1>

              <p className="mt-3 text-sm text-zinc-500">
                View your AutoCore orders
                and their status.
              </p>

            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              Refresh Orders
            </button>

          </div>

        </div>

      </section>


      {/* ================= CONTENT ================= */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* LOADING */}

        {loading && (
          <div className="flex min-h-[350px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

              <p className="text-sm text-zinc-500">
                Loading your orders...
              </p>

            </div>

          </div>
        )}


        {/* ERROR */}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
              !
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Unable to load orders
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={loadOrders}
              className="mt-6 rounded-xl bg-[#e5253f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d]"
            >
              Try Again
            </button>

          </div>
        )}


        {/* NO ORDERS */}

        {!loading &&
          !error &&
          orders.length === 0 && (

            <div className="rounded-2xl border border-white/10 bg-[#11151d] p-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-4xl">
                📦
              </div>

              <h2 className="mt-6 text-2xl font-bold">
                No orders yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Your orders will appear
                here after you place
                an order.
              </p>

              <Link
                href="/shop"
                className="mt-7 inline-flex rounded-xl bg-[#e5253f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d]"
              >
                Browse Parts
              </Link>

            </div>
          )}


        {/* ORDERS */}

        {!loading &&
          !error &&
          orders.length > 0 && (

            <div className="space-y-4">

              {orders.map((order) => (

                <div
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-[#11151d] p-6 transition hover:border-white/20"
                >

                  <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

                    {/* ORDER */}

                    <div>

                      <p className="text-xs uppercase tracking-wider text-zinc-500">
                        Order
                      </p>

                      <h2 className="mt-1 text-lg font-bold">
                        {order.orderNumber}
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        {new Date(
                          order.date
                        ).toLocaleString(
                          "en-US",
                          {
                            dateStyle:
                              "medium",
                            timeStyle:
                              "short",
                          }
                        )}
                      </p>

                    </div>


                    {/* ITEMS */}

                    <div>

                      <p className="text-xs text-zinc-500">
                        Items
                      </p>

                      <p className="mt-1 font-semibold text-white">
                        {order.items}
                      </p>

                    </div>


                    {/* STATUS */}

                    <div>

                      <p className="text-xs text-zinc-500">
                        Status
                      </p>

                      <span className="mt-1 inline-block rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                        {formatStatus(
                          order.status
                        )}
                      </span>

                    </div>


                    {/* TOTAL */}

                    <div className="text-left md:text-right">

                      <p className="text-xs text-zinc-500">
                        Total
                      </p>

                      <p className="mt-1 text-xl font-bold text-white">
                        $
                        {formatPrice(
                          Number(
                            order.total
                          )
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

      </section>


      {/* ================= FOOTER ================= */}

      <footer className="mt-16 border-t border-white/10 bg-[#0d1016]">

        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-zinc-600">

          ©{" "}
          {new Date().getFullYear()}{" "}
          AutoCore. All rights reserved.

        </div>

      </footer>

    </main>
  );
}