"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  addToCart,
  getCartCount,
} from "@/lib/shop-cart";

type Part = {
  id: string;
  partNumber: string;
  name: string;
  description: string | null;
  manufacturer: string | null;
  sellingPrice: string | number;
  imageUrl: string | null;
  status: string;
  category: {
    name: string;
  } | null;
};

/*
=========================================================
PART IMAGE MAPPING
=========================================================

These files are inside:

public/parts/

The paths below are therefore:

/parts/filename.jpg
*/

const partImages: Record<string, string> = {
  "Clutch Plates":
    "/parts/performance-clutch-kit.jpg",

  "Honda Civic Brake Pad":
    "/parts/honda-civic-brake-pad.jpg",

  "Front Suspension Strut":
    "/parts/front-suspension-strut.jpg",

  "Engine Air Filter":
    "/parts/engine-air-filter.jpg",

  "Performance Radiator Assembly":
    "/parts/performance-radiator.jpg",

  "Front Brake Disc":
    "/parts/front-brake-disc.jpg",

  "Performance Clutch Kit":
    "/parts/performance-clutch-kit.jpg",

  "K20 Ignition Coil":
    "/parts/k20-ignition-coil.jpg",

  "S58 Twin Turbocharger Assembly":
    "/parts/s58-twin-turbo.jpg",

  "Radiator Cooling Fan":
    "/parts/radiator-cooling-fan.jpg",
};


/*
=========================================================
GET IMAGE FOR PART
=========================================================
*/

function getPartImage(part: Part): string | null {
  /*
   * First use our exact product-name mapping.
   */

  if (partImages[part.name]) {
    return partImages[part.name];
  }

  /*
   * If a product isn't in the mapping,
   * try the database imageUrl.
   */

  if (part.imageUrl) {
    if (
      part.imageUrl.startsWith("http://") ||
      part.imageUrl.startsWith("https://") ||
      part.imageUrl.startsWith("/")
    ) {
      return part.imageUrl;
    }

    return `/${part.imageUrl}`;
  }

  return null;
}


/*
=========================================================
SHOP PAGE
=========================================================
*/

export default function ShopPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userEmail, setUserEmail] = useState("");
  const [cartCount, setCartCount] = useState(0);

  /*
  ========================================================
  LOAD PAGE
  ========================================================
  */

  useEffect(() => {
    loadShop();

    updateCartCount();

    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener(
      "autocore-cart-updated",
      handleCartUpdate
    );

    window.addEventListener(
      "storage",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "autocore-cart-updated",
        handleCartUpdate
      );

      window.removeEventListener(
        "storage",
        handleCartUpdate
      );
    };
  }, []);


  /*
  ========================================================
  CART COUNT
  ========================================================
  */

  function updateCartCount() {
    setCartCount(getCartCount());
  }


  /*
  ========================================================
  LOAD PRODUCTS
  ========================================================
  */

  async function loadShop() {
    try {
      setLoading(true);
      setError("");

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email ?? "");
      }

      const response = await fetch("/api/parts");

      if (!response.ok) {
        throw new Error(
          "Failed to load parts."
        );
      }

      const data = await response.json();

      const activeParts = data.filter(
        (part: Part) =>
          part.status === "ACTIVE"
      );

      setParts(activeParts);
    } catch (error) {
      console.error(
        "Shop loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }


  /*
  ========================================================
  ADD TO CART
  ========================================================
  */

  function handleAddToCart(part: Part) {
    addToCart({
      id: part.id,
      partNumber: part.partNumber,
      name: part.name,
      sellingPrice: Number(
        part.sellingPrice
      ),
      imageUrl: getPartImage(part),
    });

    updateCartCount();
  }


  /*
  ========================================================
  LOGOUT
  ========================================================
  */

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/login";
  }


  /*
  ========================================================
  RENDER
  ========================================================
  */

  return (
    <main className="min-h-screen bg-[#090b10] text-white">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="border-b border-white/10 bg-[#0d1016]">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link
            href="/shop"
            className="text-2xl font-black tracking-tight"
          >
            AUTO
            <span className="text-[#e5253f]">
              CORE
            </span>
          </Link>


          <div className="flex items-center gap-4">

            <Link
              href="/shop"
              className="
                text-sm
                text-zinc-300
                transition
                hover:text-white
              "
            >
              Shop
            </Link>


            <Link
              href="/orders"
              className="
                text-sm
                text-zinc-300
                transition
                hover:text-white
              "
            >
              My Orders
            </Link>


            <Link
              href="/cart"
              className="
                flex
                items-center
                gap-2
                rounded-lg
                border
                border-white/10
                px-4
                py-2
                text-sm
                text-zinc-300
                transition
                hover:bg-white/5
                hover:text-white
              "
            >
              Cart

              {cartCount > 0 && (
                <span
                  className="
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-[#e5253f]
                    px-1.5
                    text-xs
                    font-bold
                    text-white
                  "
                >
                  {cartCount}
                </span>
              )}
            </Link>


            <div className="hidden text-right md:block">

              <p className="text-xs text-zinc-500">
                Signed in as
              </p>

              <p className="max-w-[180px] truncate text-sm text-white">
                {userEmail}
              </p>

            </div>


            <button
              type="button"
              onClick={handleLogout}
              className="
                rounded-lg
                border
                border-red-500/20
                px-4
                py-2
                text-sm
                text-red-400
                transition
                hover:bg-red-500/10
              "
            >
              Logout
            </button>

          </div>

        </div>

      </nav>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="
          border-b
          border-white/10
          bg-[#0b0e13]
        "
      >

        <div className="mx-auto max-w-7xl px-6 py-16">

          <p
            className="
              mb-3
              text-xs
              font-semibold
              uppercase
              tracking-[0.25em]
              text-[#e5253f]
            "
          >
            Auto Parts Marketplace
          </p>


          <h1
            className="
              max-w-3xl
              text-4xl
              font-black
              tracking-tight
              md:text-6xl
            "
          >
            Find the right parts

            <span className="text-[#e5253f]">
              {" "}for your vehicle.
            </span>
          </h1>


          <p
            className="
              mt-5
              max-w-2xl
              text-base
              leading-7
              text-zinc-400
            "
          >
            Browse genuine automotive parts
            available through AutoCore and
            order the parts you need.
          </p>


          {cartCount > 0 && (
            <Link
              href="/cart"
              className="
                mt-8
                inline-flex
                items-center
                gap-3
                rounded-xl
                bg-[#e5253f]
                px-6
                py-3
                font-semibold
                text-white
                transition
                hover:bg-[#ff334d]
              "
            >
              View Cart

              <span
                className="
                  flex
                  h-6
                  min-w-6
                  items-center
                  justify-center
                  rounded-full
                  bg-white/20
                  px-2
                  text-sm
                "
              >
                {cartCount}
              </span>
            </Link>
          )}

        </div>

      </section>


      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <section
        className="
          mx-auto
          max-w-7xl
          px-6
          py-10
        "
      >

        {/* HEADER */}

        <div
          className="
            mb-8
            flex
            items-end
            justify-between
          "
        >

          <div>

            <p
              className="
                text-xs
                uppercase
                tracking-widest
                text-zinc-500
              "
            >
              AutoCore Store
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Available Parts
            </h2>

          </div>


          <p className="text-sm text-zinc-500">
            {parts.length} products
          </p>

        </div>


        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (
          <div
            className="
              flex
              min-h-[300px]
              items-center
              justify-center
            "
          >

            <div className="text-center">

              <div
                className="
                  mx-auto
                  mb-4
                  h-9
                  w-9
                  animate-spin
                  rounded-full
                  border-2
                  border-white/10
                  border-t-[#e5253f]
                "
              />

              <p className="text-sm text-zinc-500">
                Loading products...
              </p>

            </div>

          </div>
        )}


        {/* ===================================================
            ERROR
        =================================================== */}

        {!loading && error && (
          <div
            className="
              rounded-2xl
              border
              border-red-500/20
              bg-red-500/5
              p-6
              text-center
            "
          >

            <p className="text-sm text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={loadShop}
              className="
                mt-4
                rounded-lg
                bg-[#e5253f]
                px-4
                py-2
                text-sm
                font-medium
              "
            >
              Try Again
            </button>

          </div>
        )}


        {/* ===================================================
            EMPTY
        =================================================== */}

        {!loading &&
          !error &&
          parts.length === 0 && (
            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-[#11151d]
                p-12
                text-center
              "
            >

              <h3 className="text-lg font-semibold">
                No parts available
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                There are currently no active
                parts available for customers.
              </p>

            </div>
          )}


        {/* ===================================================
            PRODUCT GRID
        =================================================== */}

        {!loading &&
          !error &&
          parts.length > 0 && (

            <div
              className="
                grid
                gap-5
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-3
              "
            >

              {parts.map((part) => {

                const image =
                  getPartImage(part);

                return (
                  <div
                    key={part.id}
                    className="
                      group
                      relative
                      overflow-hidden
                      rounded-2xl
                      border
                      border-white/10
                      bg-[#11151d]
                      transition
                      duration-300
                      hover:-translate-y-1
                      hover:border-[#e5253f]/50
                      hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]
                    "
                  >

                    {/* =================================================
                        IMAGE AREA
                    ================================================= */}

                    <div
                      className="
                        relative
                        h-64
                        w-full
                        overflow-hidden
                        bg-[#090c11]
                      "
                    >

                      {/* IMAGE */}

                      {image ? (
                        <img
                          src={image}
                          alt={part.name}
                          className="
                            absolute
                            inset-0
                            h-full
                            w-full
                            object-cover
                            object-center
                            transition
                            duration-500
                            group-hover:scale-110
                          "
                          onError={(event) => {
                            console.error(
                              "IMAGE FAILED:",
                              image
                            );

                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div
                          className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            bg-gradient-to-br
                            from-[#11151d]
                            to-[#080a0e]
                          "
                        >

                          <div className="text-center">

                            <div
                              className="
                                text-5xl
                                opacity-20
                              "
                            >
                              ⚙
                            </div>

                            <p
                              className="
                                mt-2
                                text-xs
                                text-zinc-600
                              "
                            >
                              No image available
                            </p>

                          </div>

                        </div>
                      )}


                      {/* DARK GRADIENT */}

                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-0
                          bg-gradient-to-t
                          from-[#11151d]
                          via-transparent
                          to-black/20
                        "
                      />


                      {/* CATEGORY */}

                      {part.category && (
                        <div
                          className="
                            absolute
                            left-3
                            top-3
                            z-10
                            rounded-lg
                            border
                            border-white/10
                            bg-black/70
                            px-3
                            py-2
                            backdrop-blur-md
                          "
                        >

                          <p
                            className="
                              text-[10px]
                              font-semibold
                              uppercase
                              tracking-wider
                              text-[#ff334d]
                            "
                          >
                            {part.category.name}
                          </p>

                        </div>
                      )}


                      {/* VIEW PART */}

                      <div
                        className="
                          absolute
                          bottom-4
                          right-4
                          z-10
                          translate-y-2
                          opacity-0
                          transition
                          duration-300
                          group-hover:translate-y-0
                          group-hover:opacity-100
                        "
                      >

                        <Link
                          href={`/shop/${part.id}`}
                          className="
                            rounded-lg
                            bg-black/80
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-white
                            backdrop-blur-md
                            transition
                            hover:bg-[#e5253f]
                          "
                        >
                          VIEW PART
                        </Link>

                      </div>

                    </div>


                    {/* =================================================
                        PRODUCT INFORMATION
                    ================================================= */}

                    <div className="p-5">

                      <h3
                        className="
                          min-h-[48px]
                          text-lg
                          font-semibold
                          leading-6
                          text-white
                        "
                      >
                        {part.name}
                      </h3>


                      <div className="mt-4 space-y-1">

                        <p
                          className="
                            text-xs
                            text-zinc-500
                          "
                        >
                          Part No:{" "}
                          {part.partNumber}
                        </p>


                        {part.manufacturer && (
                          <p
                            className="
                              text-xs
                              text-zinc-500
                            "
                          >
                            Manufacturer:{" "}
                            {part.manufacturer}
                          </p>
                        )}

                      </div>


                      {part.description && (
                        <p
                          className="
                            mt-4
                            line-clamp-2
                            min-h-[36px]
                            text-xs
                            leading-5
                            text-zinc-600
                          "
                        >
                          {part.description}
                        </p>
                      )}


                      {/* PRICE + CART */}

                      <div
                        className="
                          mt-6
                          flex
                          items-end
                          justify-between
                          gap-3
                        "
                      >

                        <div>

                          <p
                            className="
                              text-xs
                              text-zinc-500
                            "
                          >
                            Price
                          </p>

                          <p
                            className="
                              text-xl
                              font-bold
                              text-white
                            "
                          >
                            $
                            {Number(
                              part.sellingPrice
                            ).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>

                        </div>


                        <button
                          type="button"
                          onClick={() =>
                            handleAddToCart(
                              part
                            )
                          }
                          className="
                            rounded-xl
                            bg-[#e5253f]
                            px-4
                            py-2.5
                            text-sm
                            font-semibold
                            text-white
                            shadow-[0_8px_25px_rgba(229,37,63,0.15)]
                            transition
                            hover:bg-[#ff334d]
                            hover:shadow-[0_8px_30px_rgba(229,37,63,0.3)]
                            active:scale-95
                          "
                        >
                          Add to Cart
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        className="
          mt-16
          border-t
          border-white/10
          bg-[#0d1016]
        "
      >

        <div
          className="
            mx-auto
            max-w-7xl
            px-6
            py-8
            text-center
            text-sm
            text-zinc-600
          "
        >
          ©{" "}
          {new Date().getFullYear()}{" "}
          AutoCore. All rights reserved.
        </div>

      </footer>

    </main>
  );
}