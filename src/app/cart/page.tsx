"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type CartItem = {
  id: string;
  partNumber: string;
  name: string;
  description?: string | null;
  manufacturer?: string | null;
  sellingPrice: string | number;
  imageUrl?: string | null;
  quantity: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userEmail, setUserEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  /*
   * Load cart and logged-in user
   */
  useEffect(() => {
    loadCart();
    loadUser();
  }, []);

  function loadCart() {
    try {
      const savedCart = localStorage.getItem("autocore-cart");

      if (!savedCart) {
        setCart([]);
        setLoading(false);
        return;
      }

      const parsedCart = JSON.parse(savedCart);

      if (Array.isArray(parsedCart)) {
        setCart(parsedCart);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
      setCart([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadUser() {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email ?? "");
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  }

  /*
   * Save cart to localStorage
   */
  function saveCart(updatedCart: CartItem[]) {
    setCart(updatedCart);

    localStorage.setItem(
      "autocore-cart",
      JSON.stringify(updatedCart)
    );
  }

  /*
   * Increase quantity
   */
  function increaseQuantity(id: string) {
    const updatedCart = cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item
    );

    saveCart(updatedCart);
  }

  /*
   * Decrease quantity
   */
  function decreaseQuantity(id: string) {
    const updatedCart = cart
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item
      )
      .filter((item) => item.quantity > 0);

    saveCart(updatedCart);
  }

  /*
   * Remove item completely
   */
  function removeItem(id: string) {
    const updatedCart = cart.filter(
      (item) => item.id !== id
    );

    saveCart(updatedCart);
  }

  /*
   * Clear complete cart
   */
  function clearCart() {
    localStorage.removeItem("autocore-cart");
    setCart([]);
  }

  /*
   * Calculate subtotal
   */
  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return (
        total +
        Number(item.sellingPrice) * item.quantity
      );
    }, 0);
  }, [cart]);

  /*
   * Number of individual units
   */
  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cart]);

  /*
   * Format money
   */
  function formatPrice(value: number) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /*
   * Place order
   */
  async function handlePlaceOrder() {
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setPlacingOrder(true);

      /*
       * Send only IDs and quantities.
       *
       * The API will get the real prices from the database.
       */
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            partId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to place order."
        );
      }

      /*
       * Order successfully created.
       */
      localStorage.removeItem("autocore-cart");
      setCart([]);

      /*
       * Go to My Orders.
       */
      window.location.href = "/orders";
    } catch (error) {
      console.error(
        "Failed to place order:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to place order."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  /*
   * Logout
   */
  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      {/* ================= NAVBAR ================= */}

      <nav className="border-b border-white/10 bg-[#0d1016]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* LOGO */}

          <Link
            href="/shop"
            className="text-2xl font-black tracking-tight"
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
              className="text-sm text-zinc-300 transition hover:text-white"
            >
              My Orders
            </Link>

            <Link
              href="/cart"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5"
            >
              Cart
              {totalItems > 0 && (
                <span className="ml-2 rounded-full bg-[#e5253f] px-2 py-0.5 text-xs font-bold">
                  {totalItems}
                </span>
              )}
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
              onClick={handleLogout}
              className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ================= PAGE HEADER ================= */}

      <section className="border-b border-white/10 bg-[#0b0e13]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e5253f]">
            AutoCore Store
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Your Cart
              </h1>

              <p className="mt-3 text-sm text-zinc-500">
                Review your selected parts before placing
                your order.
              </p>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                disabled={placingOrder}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ================= CONTENT ================= */}

      <section className="mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          /* LOADING */

          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

              <p className="text-sm text-zinc-500">
                Loading your cart...
              </p>
            </div>
          </div>
        ) : cart.length === 0 ? (
          /* EMPTY CART */

          <div className="rounded-2xl border border-white/10 bg-[#11151d] p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-4xl">
              🛒
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Browse our available auto parts and add
              something to your cart.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex rounded-xl bg-[#e5253f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d]"
            >
              Browse Parts
            </Link>
          </div>
        ) : (
          /* CART */

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* ================= CART ITEMS ================= */}

            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#11151d]"
                >
                  <div className="flex flex-col gap-5 p-5 sm:flex-row">
                    {/* IMAGE */}

                    <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#090c11] sm:w-36">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="text-3xl opacity-30">
                            ⚙
                          </div>

                          <p className="mt-1 text-[10px] text-zinc-600">
                            No image
                          </p>
                        </div>
                      )}
                    </div>

                    {/* PRODUCT INFO */}

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#e5253f]">
                          {item.partNumber}
                        </p>

                        <h2 className="mt-1 text-lg font-semibold text-white">
                          {item.name}
                        </h2>

                        {item.manufacturer && (
                          <p className="mt-1 text-xs text-zinc-500">
                            {item.manufacturer}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                        {/* QUANTITY */}

                        <div className="flex items-center rounded-xl border border-white/10 bg-[#0b0e13]">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(item.id)
                            }
                            disabled={placingOrder}
                            className="flex h-10 w-10 items-center justify-center text-lg text-zinc-400 transition hover:text-white disabled:opacity-40"
                          >
                            −
                          </button>

                          <span className="w-10 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(item.id)
                            }
                            disabled={placingOrder}
                            className="flex h-10 w-10 items-center justify-center text-lg text-zinc-400 transition hover:text-white disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        {/* PRICE */}

                        <div className="text-right">
                          <p className="text-xs text-zinc-500">
                            Price
                          </p>

                          <p className="text-lg font-bold text-white">
                            $
                            {formatPrice(
                              Number(
                                item.sellingPrice
                              )
                            )}
                          </p>
                        </div>

                        {/* REMOVE */}

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.id)
                          }
                          disabled={placingOrder}
                          className="text-xs text-red-400 transition hover:text-red-300 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LINE TOTAL */}

                  <div className="flex items-center justify-between border-t border-white/5 bg-[#0d1016] px-5 py-3">
                    <span className="text-xs text-zinc-500">
                      {item.quantity} × $
                      {formatPrice(
                        Number(item.sellingPrice)
                      )}
                    </span>

                    <span className="text-sm font-semibold text-white">
                      $
                      {formatPrice(
                        Number(item.sellingPrice) *
                          item.quantity
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ================= ORDER SUMMARY ================= */}

            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-white/10 bg-[#11151d] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Order Summary
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Checkout
                </h2>

                {/* ITEMS */}

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">
                      Items
                    </span>

                    <span className="text-white">
                      {totalItems}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">
                      Subtotal
                    </span>

                    <span className="text-white">
                      ${formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">
                      Discount
                    </span>

                    <span className="text-zinc-400">
                      $0.00
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">
                      Tax
                    </span>

                    <span className="text-zinc-400">
                      $0.00
                    </span>
                  </div>
                </div>

                {/* TOTAL */}

                <div className="my-6 border-t border-white/10 pt-5">
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-zinc-400">
                      Total
                    </span>

                    <span className="text-3xl font-black text-white">
                      ${formatPrice(subtotal)}
                    </span>
                  </div>
                </div>

                {/* ERROR */}

                {error && (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-sm leading-5 text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {/* PLACE ORDER */}

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={
                    placingOrder ||
                    cart.length === 0
                  }
                  className="w-full rounded-xl bg-[#e5253f] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#ff334d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placingOrder
                    ? "Placing Order..."
                    : "Place Order"}
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-zinc-600">
                  Your order will be confirmed and
                  payment will remain pending until
                  processed.
                </p>
              </div>

              {/* CONTINUE SHOPPING */}

              <Link
                href="/shop"
                className="mt-4 block rounded-xl border border-white/10 bg-[#11151d] px-6 py-3 text-center text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ================= FOOTER ================= */}

      <footer className="mt-16 border-t border-white/10 bg-[#0d1016]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-zinc-600">
          © {new Date().getFullYear()} AutoCore. All
          rights reserved.
        </div>
      </footer>
    </main>
  );
}