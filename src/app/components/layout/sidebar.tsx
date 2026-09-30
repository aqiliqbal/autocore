"use client";

import {
  BarChart3,
  Boxes,
  CarFront,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  Wrench,
  Zap,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BMW_IMAGE =
  "https://is.zobj.net/image-server/v1/images?r=R-b68bh1w7pd506CDKMv8qHPGt5yBT3YuNlJ_FQ3_uNxd641IWIO1VMQSFfgHrHEYoZem-DNBBFqqzVoBWEZwXq1IV9ZEOWR0x7bQVCmhIsV2AIDXZnaXMl_KhUyHaDXPAM2JsTiEjzzlvWiK6oveJCp98dIba59L-tYXdzxmqkrroxgaxeova9_c7otCcaWEk5NLnWVgevBeaajEGiK5Q8PzrJOiT76fKWUXNOPvVfS35TUQrXIOiAI-NM";

const menuGroups = [
  {
    title: "Main",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        name: "Inventory",
        href: "/inventory",
        icon: Package,
      },
      {
        name: "Vehicles",
        href: "/vehicles",
        icon: CarFront,
      },
      {
        name: "Engines",
        href: "/engines",
        icon: Gauge,
      },
    ],
  },

  {
    title: "Operations",
    items: [
      {
        name: "Sales",
        href: "/sales",
        icon: ShoppingCart,
      },
      {
        name: "Purchases",
        href: "/purchases",
        icon: Truck,
      },
      {
        name: "Customers",
        href: "/customers",
        icon: Users,
      },
      {
        name: "Warehouses",
        href: "/warehouses",
        icon: Warehouse,
      },
    ],
  },

  {
    title: "Management",
    items: [
      {
        name: "Categories",
        href: "/categories",
        icon: Boxes,
      },
      {
        name: "Stock Transactions",
        href: "/stock-transactions",
        icon: ClipboardList,
      },
      {
        name: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
    ],
  },

  {
    title: "System",
    items: [
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-[255px] overflow-hidden border-r border-white/[0.07] bg-[#07080b]">
      {/* =====================================================
          BMW BACKGROUND
      ====================================================== */}

      <div
        className="absolute inset-0 bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: `url("${BMW_IMAGE}")`,
          backgroundPosition: "center bottom",
          backgroundSize: "auto 72%",
        }}
      />

      {/* =====================================================
          DARK OVERLAY
      ====================================================== */}

      <div className="absolute inset-0 bg-[#07080b]/55" />

      {/* =====================================================
          TOP DARK GRADIENT
      ====================================================== */}

      <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-[#07080b] via-[#07080b]/95 to-transparent" />

      {/* =====================================================
          LEFT / RIGHT DARK BLENDING
      ====================================================== */}

      <div className="absolute inset-0 bg-gradient-to-r from-[#07080b]/95 via-[#07080b]/55 to-[#07080b]/35" />

      {/* =====================================================
          BOTTOM DARK GRADIENT
      ====================================================== */}

      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#07080b] via-[#07080b]/70 to-transparent" />

      {/* =====================================================
          RED AUTOMOTIVE GLOW
      ====================================================== */}

      <div className="pointer-events-none absolute -left-20 bottom-[20%] h-64 w-64 rounded-full bg-[#e5253f]/10 blur-[100px]" />

      <div className="pointer-events-none absolute right-[-80px] top-[35%] h-56 w-56 rounded-full bg-[#e5253f]/10 blur-[100px]" />

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 flex h-full flex-col">

        {/* ===================================================
            LOGO
        ==================================================== */}

        <div className="flex h-[82px] items-center border-b border-white/[0.07] px-6">

          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            {/* Logo Icon */}

            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#e5253f]/40 bg-[#0b0d11]/90 shadow-[0_0_25px_rgba(229,37,63,0.12)] transition-all duration-300 group-hover:border-[#e5253f]/70 group-hover:shadow-[0_0_30px_rgba(229,37,63,0.2)]">
              <Wrench
                size={21}
                className="text-[#ff334d]"
              />

              <div className="absolute inset-0 rounded-xl bg-[#e5253f]/5" />
            </div>

            {/* Brand */}

            <div>
              <div className="font-display text-[19px] leading-none tracking-wide text-white">
                AUTO
                <span className="text-[#ff334d]">
                  CORE
                </span>
              </div>

              <p className="mt-1 font-technical text-[7px] uppercase tracking-[0.28em] text-zinc-600">
                Automotive Systems
              </p>
            </div>
          </Link>
        </div>

        {/* ===================================================
            NAVIGATION
        ==================================================== */}

        <nav className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">

          {menuGroups.map((group) => (
            <div
              key={group.title}
              className="mb-6"
            >
              {/* Group title */}

              <p className="mb-2 px-3 font-technical text-[9px] font-semibold uppercase tracking-[0.28em] text-zinc-600">
                {group.title}
              </p>

              {/* Group items */}

              <div className="space-y-1">

                {group.items.map((item) => {
                  const Icon = item.icon;

                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(
                          `${item.href}/`,
                        );

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-[#e5253f]/15 text-white shadow-[0_0_25px_rgba(229,37,63,0.08)]"
                          : "text-zinc-500 hover:bg-white/[0.045] hover:text-white"
                      }`}
                    >

                      {/* Active red line */}

                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#ff334d] shadow-[0_0_10px_rgba(255,51,77,0.8)]" />
                      )}

                      {/* Icon */}

                      <Icon
                        size={17}
                        strokeWidth={1.7}
                        className={`transition-colors ${
                          isActive
                            ? "text-[#ff334d]"
                            : "text-zinc-600 group-hover:text-zinc-300"
                        }`}
                      />

                      {/* Text */}

                      <span className="truncate">
                        {item.name}
                      </span>

                      {/* Active arrow */}

                      {isActive && (
                        <span className="ml-auto text-[#ff334d]">
                          ›
                        </span>
                      )}
                    </Link>
                  );
                })}

              </div>
            </div>
          ))}

        </nav>

        {/* ===================================================
            SYSTEM STATUS
        ==================================================== */}

        <div className="relative px-5 pb-5">

          <div className="mb-4 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#080a0e]/65 px-3 py-2.5 backdrop-blur-md">

            <div className="flex items-center gap-2">

              <span className="relative flex h-2 w-2">

                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />

              </span>

              <div>
                <p className="font-technical text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                  System
                </p>

                <p className="text-[10px] text-emerald-400">
                  Operational
                </p>
              </div>

            </div>

            <Zap
              size={13}
              className="text-emerald-400"
            />

          </div>

          <p className="mt-3 text-center font-technical text-[8px] uppercase tracking-[0.2em] text-zinc-700">
            AutoCore v1.0
          </p>

        </div>

      </div>
    </aside>
  );
}