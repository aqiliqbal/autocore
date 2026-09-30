"use client";

import DashboardLayout from "../components/layout/dashboard-layout";
import {
  Bell,
  Database,
  Lock,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1200px] p-6 lg:p-8">

        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e5253f]" />

            <p className="font-technical text-xs uppercase tracking-[0.25em] text-[#e5253f]">
              AutoCore / Settings
            </p>
          </div>

          <h1 className="font-display text-5xl tracking-wide text-white lg:text-6xl">
            SYSTEM SETTINGS
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Configure AutoCore system preferences, account settings and
            security controls.
          </p>
        </section>

        {/* PROFILE */}
        <section className="rounded-2xl border border-white/8 bg-[#0e1117] p-6">

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5253f]/10 text-[#ff334d]">
              <User size={19} />
            </div>

            <div>
              <h2 className="font-technical text-sm font-semibold uppercase tracking-wider text-white">
                Administrator Profile
              </h2>

              <p className="text-xs text-zinc-600">
                Manage your AutoCore account
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-xs text-zinc-500">
                Full Name
              </label>

              <input
                defaultValue="Admin Manager"
                className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white outline-none focus:border-[#e5253f]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-zinc-500">
                Email
              </label>

              <input
                defaultValue="admin@autocore.local"
                className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white outline-none focus:border-[#e5253f]/50"
              />
            </div>

          </div>
        </section>

        {/* SYSTEM */}
        <section className="mt-6 rounded-2xl border border-white/8 bg-[#0e1117] p-6">

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
              <Database size={19} />
            </div>

            <div>
              <h2 className="font-technical text-sm font-semibold uppercase tracking-wider text-white">
                System Configuration
              </h2>

              <p className="text-xs text-zinc-600">
                Configure basic application preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-xs text-zinc-500">
                Currency
              </label>

              <select className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-zinc-300 outline-none">
                <option>USD - US Dollar</option>
                <option>PKR - Pakistani Rupee</option>
                <option>EUR - Euro</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs text-zinc-500">
                Inventory Warning Level
              </label>

              <input
                defaultValue="5"
                type="number"
                className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white outline-none focus:border-[#e5253f]/50"
              />
            </div>

          </div>
        </section>

        {/* SECURITY */}
        <section className="mt-6 rounded-2xl border border-white/8 bg-[#0e1117] p-6">

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={19} />
            </div>

            <div>
              <h2 className="font-technical text-sm font-semibold uppercase tracking-wider text-white">
                Security
              </h2>

              <p className="text-xs text-zinc-600">
                AutoCore security configuration
              </p>
            </div>
          </div>

          <div className="space-y-3">

            <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <Lock size={17} className="text-zinc-500" />

                <div>
                  <p className="text-sm text-zinc-300">
                    Two-Factor Authentication
                  </p>

                  <p className="text-xs text-zinc-600">
                    Require an additional authentication step
                  </p>
                </div>
              </div>

              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-400">
                Enabled
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <Bell size={17} className="text-zinc-500" />

                <div>
                  <p className="text-sm text-zinc-300">
                    Security Notifications
                  </p>

                  <p className="text-xs text-zinc-600">
                    Receive alerts for suspicious activity
                  </p>
                </div>
              </div>

              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-400">
                Active
              </span>
            </div>

          </div>
        </section>

        <button
          type="button"
          className="btn-red mt-6 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          <Save size={17} />
          Save Settings
        </button>

      </div>
    </DashboardLayout>
  );
}