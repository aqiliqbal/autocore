"use client";

import {
  Bell,
  ChevronDown,
  Command,
  Search,
  ShieldCheck,
  Package,
  CarFront,
  Gauge,
  Users,
  Truck,
  ShoppingCart,
  X,
  ArrowRight,
  User,
  Settings,
  LogOut,
  Store,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type SearchResult = {
  id: string;

  type:
    | "Part"
    | "Vehicle"
    | "Engine"
    | "Customer"
    | "Supplier"
    | "Sale"
    | "Purchase";

  title: string;

  subtitle: string;

  href: string;
};

export default function Topbar() {
  const router = useRouter();

  /*
   * =========================================================
   * REFS
   * =========================================================
   */

  const inputRef =
    useRef<HTMLInputElement>(null);

  const searchContainerRef =
    useRef<HTMLDivElement>(null);

  const userMenuRef =
    useRef<HTMLDivElement>(null);

  /*
   * =========================================================
   * SEARCH STATE
   * =========================================================
   */

  const [search, setSearch] =
    useState("");

  const [results, setResults] =
    useState<SearchResult[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [showResults, setShowResults] =
    useState(false);

  /*
   * =========================================================
   * ADMIN MENU
   * =========================================================
   */

  const [showUserMenu, setShowUserMenu] =
    useState(false);

  /*
   * =========================================================
   * SIGN OUT LOADING
   * =========================================================
   */

  const [signingOut, setSigningOut] =
    useState(false);

  /*
   * =========================================================
   * TOPBAR IMAGE
   *
   * Your saved image should be:
   *
   * public/topbar-bmw.jpg
   *
   * URL:
   *
   * /topbar-bmw.jpg
   * =========================================================
   */

  const topbarImage =
    "/topbar-bmw.jpg";

  /*
   * =========================================================
   * CTRL + K / CMD + K
   * =========================================================
   */

  useEffect(() => {
    function handleShortcut(
      event: KeyboardEvent,
    ) {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        inputRef.current?.focus();

        setShowResults(true);

        setShowUserMenu(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleShortcut,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleShortcut,
      );
    };
  }, []);

  /*
   * =========================================================
   * CLICK OUTSIDE
   * =========================================================
   */

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent,
    ) {
      const target =
        event.target as Node;

      /*
       * CLOSE SEARCH
       */

      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(
          target,
        )
      ) {
        setShowResults(false);
      }

      /*
       * CLOSE USER MENU
       */

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(
          target,
        )
      ) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /*
   * =========================================================
   * GLOBAL SEARCH
   * =========================================================
   */

  useEffect(() => {
    const query =
      search.trim();

    if (!query) {
      setResults([]);

      setLoading(false);

      return;
    }

    const timeout =
      setTimeout(async () => {
        try {
          setLoading(true);

          setShowResults(true);

          const response =
            await fetch(
              `/api/global-search?q=${encodeURIComponent(
                query,
              )}`,
            );

          if (!response.ok) {
            throw new Error(
              "Search failed",
            );
          }

          const data =
            await response.json();

          setResults(
            Array.isArray(data)
              ? data
              : [],
          );
        } catch (error) {
          console.error(
            "Global search error:",
            error,
          );

          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 250);

    return () =>
      clearTimeout(timeout);
  }, [search]);

  /*
   * =========================================================
   * OPEN SEARCH RESULT
   * =========================================================
   */

  function openResult(
    result: SearchResult,
  ) {
    setShowResults(false);

    setSearch("");

    router.push(result.href);
  }

  /*
   * =========================================================
   * SEARCH KEYBOARD
   * =========================================================
   */

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    /*
     * ENTER
     */

    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      if (results.length > 0) {
        openResult(
          results[0],
        );

        return;
      }

      router.push(
        `/search?q=${encodeURIComponent(
          search.trim(),
        )}`,
      );

      setShowResults(false);

      return;
    }

    /*
     * ESCAPE
     */

    if (
      event.key === "Escape"
    ) {
      setShowResults(false);

      inputRef.current?.blur();
    }
  }

  /*
   * =========================================================
   * RESULT ICON
   * =========================================================
   */

  function getResultIcon(
    type: SearchResult["type"],
  ) {
    if (type === "Part") {
      return (
        <Package size={16} />
      );
    }

    if (type === "Vehicle") {
      return (
        <CarFront size={16} />
      );
    }

    if (type === "Engine") {
      return (
        <Gauge size={16} />
      );
    }

    if (type === "Customer") {
      return (
        <Users size={16} />
      );
    }

    if (type === "Supplier") {
      return (
        <Truck size={16} />
      );
    }

    if (type === "Sale") {
      return (
        <ShoppingCart size={16} />
      );
    }

    return (
      <Package size={16} />
    );
  }

  /*
   * =========================================================
   * CLEAR SEARCH
   * =========================================================
   */

  function clearSearch() {
    setSearch("");

    setResults([]);

    setShowResults(false);

    inputRef.current?.focus();
  }

  /*
   * =========================================================
   * OPEN SETTINGS
   * =========================================================
   */

  function openSettings() {
    setShowUserMenu(false);

    router.push("/settings");
  }

  /*
   * =========================================================
   * OPEN ADMIN PROFILE
   * =========================================================
   */

  function openProfile() {
    setShowUserMenu(false);

    router.push("/customers");
  }

  /*
   * =========================================================
   * CUSTOMER LOGIN
   * =========================================================
   *
   * Takes the user to the existing customer login page.
   * =========================================================
   */

  function openCustomerLogin() {
    setShowUserMenu(false);

    router.push("/login");
  }

  /*
   * =========================================================
   * CUSTOMER SHOP
   * =========================================================
   */

  function openCustomerShop() {
    setShowUserMenu(false);

    router.push("/shop");
  }

  /*
   * =========================================================
   * REAL SUPABASE SIGN OUT
   * =========================================================
   *
   * This is the important fix.
   *
   * Previously:
   *
   * router.push("/")
   *
   * was only changing the page.
   *
   * Now:
   *
   * supabase.auth.signOut()
   *
   * actually destroys the Supabase
   * authentication session.
   * =========================================================
   */

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    try {
      setSigningOut(true);

      setShowUserMenu(false);

      /*
       * REAL SUPABASE LOGOUT
       */

      const {
        error,
      } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Sign out error:",
          error,
        );

        setSigningOut(false);

        return;
      }

      /*
       * After successful logout,
       * send the user to the login page.
       */

      router.replace("/login");

      router.refresh();
    } catch (error) {
      console.error(
        "Unexpected sign out error:",
        error,
      );

      setSigningOut(false);
    }
  }

  return (
    <header
      className="
        sticky
        top-0
        z-[80]
        flex
        h-[82px]
        items-center
        justify-between
        overflow-visible
        border-b
        border-white/8
        bg-[#07080b]
        px-8
      "
    >
      {/* =====================================================
          TOPBAR BACKGROUND IMAGE
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-0
          overflow-hidden
        "
      >
        {/* IMAGE */}

        <img
          src={topbarImage}
          alt=""
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
            object-center
            opacity-[0.48]
          "
        />

        {/* DARK OVERLAY */}

        <div
          className="
            absolute
            inset-0
            bg-black/20
          "
        />

        {/* LEFT DARK GRADIENT */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-[#07080b]/55
            via-[#07080b]/10
            to-[#07080b]/35
          "
        />

        {/* TOP/BOTTOM DARKENING */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-[#07080b]/10
            via-transparent
            to-[#07080b]/40
          "
        />
      </div>

      {/* =====================================================
          MAIN TOPBAR CONTENT
      ===================================================== */}

      <div
        className="
          relative
          z-20
          flex
          w-full
          items-center
          justify-between
        "
      >
        {/* ===================================================
            GLOBAL SEARCH
        =================================================== */}

        <div
          ref={searchContainerRef}
          className="
            relative
            z-[100]
            w-full
            max-w-xl
          "
        >
          {/* SEARCH ICON */}

          <Search
            size={18}
            className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              z-20
              -translate-y-1/2
              text-zinc-500
            "
          />

          {/* INPUT */}

          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={(event) => {
              const value =
                event.target.value;

              setSearch(value);

              if (
                value.trim()
              ) {
                setShowResults(true);
              }
            }}
            onFocus={() => {
              if (
                search.trim()
              ) {
                setShowResults(true);
              }
            }}
            onKeyDown={
              handleSearchKeyDown
            }
            placeholder="Search parts, vehicles, OEM numbers..."
            className="
              relative
              z-10
              h-11
              w-full
              rounded-xl
              border
              border-white/10
              bg-[#101319]/90
              pl-11
              pr-24
              text-sm
              text-white
              placeholder:text-zinc-600
              outline-none
              backdrop-blur-md
              transition
              focus:border-[#e5253f]/60
              focus:bg-[#101319]
              focus:shadow-[0_0_0_2px_rgba(229,37,63,0.08)]
            "
          />

          {/* CLEAR BUTTON */}

          {search && (
            <button
              type="button"
              onClick={
                clearSearch
              }
              className="
                absolute
                right-12
                top-1/2
                z-30
                flex
                h-6
                w-6
                -translate-y-1/2
                items-center
                justify-center
                rounded-md
                text-zinc-600
                transition
                hover:bg-white/5
                hover:text-white
              "
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}

          {/* CTRL K */}

          <div
            className="
              pointer-events-none
              absolute
              right-3
              top-1/2
              z-20
              flex
              -translate-y-1/2
              items-center
              gap-1
              rounded-md
              border
              border-white/8
              bg-black/30
              px-2
              py-1
              text-[10px]
              text-zinc-500
            "
          >
            <Command size={10} />

            K
          </div>

          {/* =================================================
              SEARCH DROPDOWN
          ================================================= */}

          {showResults &&
            search.trim() && (
              <div
                className="
                  absolute
                  left-0
                  right-0
                  top-[calc(100%+10px)]
                  z-[500]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#0d1016]
                  shadow-[0_25px_80px_rgba(0,0,0,0.75)]
                "
              >
                {/* LOADING */}

                {loading && (
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      px-5
                      py-5
                      text-xs
                      text-zinc-500
                    "
                  >
                    <div
                      className="
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-white/10
                        border-t-[#e5253f]
                      "
                    />

                    Searching AutoCore...
                  </div>
                )}

                {/* RESULTS */}

                {!loading &&
                  results.length > 0 && (
                    <div
                      className="
                        max-h-[420px]
                        overflow-y-auto
                      "
                    >
                      <div
                        className="
                          border-b
                          border-white/6
                          px-4
                          py-3
                        "
                      >
                        <p
                          className="
                            font-technical
                            text-[10px]
                            uppercase
                            tracking-[0.2em]
                            text-zinc-600
                          "
                        >
                          Search Results
                        </p>
                      </div>

                      {results.map(
                        (result) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            type="button"
                            onClick={() =>
                              openResult(
                                result,
                              )
                            }
                            className="
                              group
                              flex
                              w-full
                              items-center
                              gap-4
                              border-b
                              border-white/4
                              px-4
                              py-3
                              text-left
                              transition
                              hover:bg-white/[0.04]
                            "
                          >
                            <div
                              className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-white/8
                                bg-[#151922]
                                text-[#e5253f]
                              "
                            >
                              {getResultIcon(
                                result.type,
                              )}
                            </div>

                            <div
                              className="
                                min-w-0
                                flex-1
                              "
                            >
                              <p
                                className="
                                  truncate
                                  text-sm
                                  font-medium
                                  text-zinc-200
                                "
                              >
                                {
                                  result.title
                                }
                              </p>

                              <div
                                className="
                                  mt-1
                                  flex
                                  items-center
                                  gap-2
                                "
                              >
                                <span
                                  className="
                                    font-technical
                                    text-[9px]
                                    uppercase
                                    tracking-wider
                                    text-[#e5253f]
                                  "
                                >
                                  {
                                    result.type
                                  }
                                </span>

                                <span
                                  className="
                                    truncate
                                    text-[10px]
                                    text-zinc-600
                                  "
                                >
                                  {
                                    result.subtitle
                                  }
                                </span>
                              </div>
                            </div>

                            <ArrowRight
                              size={14}
                              className="
                                shrink-0
                                text-zinc-700
                                transition
                                group-hover:translate-x-1
                                group-hover:text-[#e5253f]
                              "
                            />
                          </button>
                        ),
                      )}

                      {/* VIEW ALL */}

                      <button
                        type="button"
                        onClick={() => {
                          router.push(
                            `/search?q=${encodeURIComponent(
                              search.trim(),
                            )}`,
                          );

                          setShowResults(
                            false,
                          );
                        }}
                        className="
                          flex
                          w-full
                          items-center
                          justify-center
                          gap-2
                          px-4
                          py-3
                          text-xs
                          text-zinc-500
                          transition
                          hover:bg-white/[0.03]
                          hover:text-white
                        "
                      >
                        View all search results

                        <ArrowRight
                          size={13}
                        />
                      </button>
                    </div>
                  )}

                {/* NO RESULTS */}

                {!loading &&
                  search.trim() &&
                  results.length ===
                    0 && (
                    <div
                      className="
                        px-5
                        py-7
                        text-center
                      "
                    >
                      <Search
                        size={22}
                        className="
                          mx-auto
                          text-zinc-700
                        "
                      />

                      <p
                        className="
                          mt-3
                          text-xs
                          text-zinc-400
                        "
                      >
                        No results found
                      </p>

                      <p
                        className="
                          mt-1
                          text-[10px]
                          text-zinc-700
                        "
                      >
                        Try a part number,
                        vehicle, engine,
                        customer or OEM
                        number.
                      </p>
                    </div>
                  )}
              </div>
            )}
        </div>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <div
          className="
            ml-6
            flex
            shrink-0
            items-center
            gap-3
          "
        >
          {/* SYSTEM STATUS */}

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-lg
              border
              border-emerald-500/20
              bg-emerald-500/10
              px-3
              py-2
              text-xs
              text-emerald-400
              md:flex
            "
          >
            <ShieldCheck
              size={14}
            />

            <span>
              System
              <br />
              Online
            </span>
          </div>

          {/* NOTIFICATIONS */}

          <button
            type="button"
            className="
              relative
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-[#101319]/90
              text-zinc-500
              backdrop-blur-md
              transition
              hover:border-white/20
              hover:text-white
            "
            aria-label="Notifications"
          >
            <Bell size={17} />

            <span
              className="
                absolute
                right-2
                top-2
                h-1.5
                w-1.5
                rounded-full
                bg-[#ff334d]
                shadow-[0_0_8px_rgba(255,51,77,0.8)]
              "
            />
          </button>

          {/* =================================================
              ADMIN MANAGER
          ================================================= */}

          <div
            ref={userMenuRef}
            className="
              relative
              z-[150]
            "
          >
            {/* USER BUTTON */}

            <button
              type="button"
              onClick={() =>
                setShowUserMenu(
                  (current) =>
                    !current,
                )
              }
              className={`
                flex
                items-center
                gap-3
                rounded-xl
                border
                px-2.5
                py-1.5
                backdrop-blur-md
                transition
                ${
                  showUserMenu
                    ? "border-[#e5253f]/50 bg-[#151017]"
                    : "border-white/10 bg-[#101319]/90 hover:border-white/20"
                }
              `}
              aria-expanded={
                showUserMenu
              }
              aria-haspopup="menu"
            >
              {/* AVATAR */}

              <div
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-gradient-to-br
                  from-[#e5253f]
                  to-[#711323]
                  text-xs
                  font-bold
                  text-white
                  shadow-[0_0_15px_rgba(229,37,63,0.2)]
                "
              >
                AM
              </div>

              {/* USER INFO */}

              <div
                className="
                  hidden
                  text-left
                  md:block
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    leading-tight
                    text-white
                  "
                >
                  Admin Manager
                </p>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-zinc-600
                  "
                >
                  Administrator
                </p>
              </div>

              <ChevronDown
                size={14}
                className={`
                  text-zinc-600
                  transition-transform
                  ${
                    showUserMenu
                      ? "rotate-180 text-white"
                      : ""
                  }
                `}
              />
            </button>

            {/* =================================================
                DROPDOWN
            ================================================= */}

            {showUserMenu && (
              <div
                className="
                  absolute
                  right-0
                  top-[calc(100%+10px)]
                  z-[300]
                  w-[270px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#0d1016]
                  shadow-[0_25px_80px_rgba(0,0,0,0.8)]
                "
              >
                {/* HEADER */}

                <div
                  className="
                    border-b
                    border-white/6
                    bg-gradient-to-r
                    from-[#e5253f]/10
                    to-transparent
                    px-4
                    py-4
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-gradient-to-br
                        from-[#e5253f]
                        to-[#711323]
                        text-xs
                        font-bold
                        text-white
                      "
                    >
                      AM
                    </div>

                    <div>
                      <p
                        className="
                          text-sm
                          font-semibold
                          text-white
                        "
                      >
                        Admin Manager
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[10px]
                          text-zinc-600
                        "
                      >
                        Administrator
                      </p>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    MENU
                ================================================= */}

                <div className="p-2">

                  {/* PROFILE */}

                  <button
                    type="button"
                    onClick={
                      openProfile
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      transition
                      hover:bg-white/[0.04]
                    "
                  >
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        bg-white/[0.04]
                        text-zinc-500
                      "
                    >
                      <User
                        size={15}
                      />
                    </div>

                    <div>
                      <p
                        className="
                          text-xs
                          font-medium
                          text-zinc-300
                        "
                      >
                        Profile
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[9px]
                          text-zinc-700
                        "
                      >
                        Open customer management
                      </p>
                    </div>
                  </button>

                  {/* SETTINGS */}

                  <button
                    type="button"
                    onClick={
                      openSettings
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      transition
                      hover:bg-white/[0.04]
                    "
                  >
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        bg-white/[0.04]
                        text-zinc-500
                      "
                    >
                      <Settings
                        size={15}
                      />
                    </div>

                    <div>
                      <p
                        className="
                          text-xs
                          font-medium
                          text-zinc-300
                        "
                      >
                        Settings
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[9px]
                          text-zinc-700
                        "
                      >
                        System preferences
                      </p>
                    </div>
                  </button>

                  {/* =================================================
                      CUSTOMER LOGIN
                  ================================================= */}

                  <button
                    type="button"
                    onClick={
                      openCustomerLogin
                    }
                    className="
                      mt-1
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      transition
                      hover:bg-[#e5253f]/10
                    "
                  >
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        bg-[#e5253f]/10
                        text-[#e5253f]
                      "
                    >
                      <UserRound
                        size={15}
                      />
                    </div>

                    <div>
                      <p
                        className="
                          text-xs
                          font-medium
                          text-zinc-200
                        "
                      >
                        Customer Login
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[9px]
                          text-zinc-700
                        "
                      >
                        Login as a customer
                      </p>
                    </div>
                  </button>

                  {/* =================================================
                      CUSTOMER SHOP
                  ================================================= */}

                  <button
                    type="button"
                    onClick={
                      openCustomerShop
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      transition
                      hover:bg-white/[0.04]
                    "
                  >
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        bg-white/[0.04]
                        text-zinc-500
                      "
                    >
                      <Store
                        size={15}
                      />
                    </div>

                    <div>
                      <p
                        className="
                          text-xs
                          font-medium
                          text-zinc-300
                        "
                      >
                        Customer Shop
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[9px]
                          text-zinc-700
                        "
                      >
                        Open AutoCore storefront
                      </p>
                    </div>
                  </button>
                </div>

                {/* =================================================
                    SIGN OUT
                ================================================= */}

                <div
                  className="
                    border-t
                    border-white/6
                    p-2
                  "
                >
                  <button
                    type="button"
                    disabled={
                      signingOut
                    }
                    onClick={
                      handleSignOut
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      transition
                      hover:bg-[#e5253f]/10
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        bg-[#e5253f]/10
                        text-[#e5253f]
                      "
                    >
                      <LogOut
                        size={15}
                      />
                    </div>

                    <div>
                      <p
                        className="
                          text-xs
                          font-medium
                          text-[#ff465c]
                        "
                      >
                        {signingOut
                          ? "Signing Out..."
                          : "Sign Out"}
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[9px]
                          text-zinc-700
                        "
                      >
                        {signingOut
                          ? "Ending administrator session"
                          : "Exit administrator session"}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}