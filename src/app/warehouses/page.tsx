"use client";

import DashboardLayout from "../components/layout/dashboard-layout";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  MapPin,
  Package,
  Plus,
  Power,
  Search,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type WarehouseRecord = {
  id: string;
  code: string;
  name: string;
  zone: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    inventory: number;
    stockTransactions: number;
  };
};

type WarehouseForm = {
  code: string;
  name: string;
  zone: string;
  description: string;
};

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

type StatCardProps = {
  label: string;
  value: number;
  description: string;
  icon: React.ComponentType<IconProps>;
};

const emptyForm: WarehouseForm = {
  code: "",
  name: "",
  zone: "",
  description: "",
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<
    WarehouseRecord[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<WarehouseForm>(emptyForm);

  async function loadWarehouses() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch("/api/warehouses");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load warehouses."
        );
      }

      setWarehouses(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load warehouses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWarehouses();
  }, []);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  }

  function openEditForm(
    warehouse: WarehouseRecord
  ) {
    setEditingId(warehouse.id);

    setForm({
      code: warehouse.code,
      name: warehouse.name,
      zone: warehouse.zone || "",
      description:
        warehouse.description || "",
    });

    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (!form.code.trim()) {
      setError(
        "Warehouse code is required."
      );
      return;
    }

    if (!form.name.trim()) {
      setError(
        "Warehouse name is required."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/warehouses",
        {
          method: editingId
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            editingId
              ? {
                  id: editingId,
                  code: form.code.trim(),
                  name: form.name.trim(),
                  zone: form.zone.trim(),
                  description:
                    form.description.trim(),
                }
              : {
                  code: form.code.trim(),
                  name: form.name.trim(),
                  zone: form.zone.trim(),
                  description:
                    form.description.trim(),
                }
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save warehouse."
        );
      }

      await loadWarehouses();

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save warehouse."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleWarehouse(
    warehouse: WarehouseRecord
  ) {
    try {
      setError("");

      const response = await fetch(
        "/api/warehouses",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: warehouse.id,
            isActive:
              !warehouse.isActive,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update warehouse."
        );
      }

      setWarehouses((current) =>
        current.map((item) =>
          item.id === warehouse.id
            ? data
            : item
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update warehouse."
      );
    }
  }

  const filteredWarehouses =
    useMemo(() => {
      const searchText =
        search
          .toLowerCase()
          .trim();

      if (!searchText) {
        return warehouses;
      }

      return warehouses.filter(
        (warehouse) =>
          warehouse.code
            .toLowerCase()
            .includes(searchText) ||
          warehouse.name
            .toLowerCase()
            .includes(searchText) ||
          Boolean(
            warehouse.zone
              ?.toLowerCase()
              .includes(searchText)
          )
      );
    }, [warehouses, search]);

  const activeCount =
    warehouses.filter(
      (warehouse) =>
        warehouse.isActive
    ).length;

  const inactiveCount =
    warehouses.filter(
      (warehouse) =>
        !warehouse.isActive
    ).length;

  const inventoryLocations =
    warehouses.reduce(
      (total, warehouse) =>
        total +
        warehouse._count.inventory,
      0
    );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px] p-6 lg:p-8">

        {/* HEADER */}
        <section className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e5253f] shadow-[0_0_10px_rgba(229,37,63,0.8)]" />

                <p className="font-technical text-xs uppercase tracking-[0.25em] text-[#e5253f]">
                  AutoCore / Operations / Warehouses
                </p>
              </div>

              <h1 className="font-display text-5xl tracking-wide text-white lg:text-6xl">
                WAREHOUSES
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Manage warehouse locations,
                storage zones and inventory
                locations across AutoCore.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              className="btn-red flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
            >
              <Plus size={18} />
              Add Warehouse
            </button>

          </div>
        </section>

        {/* ERROR */}
        {error && !showForm && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">

            <AlertTriangle
              size={18}
              className="shrink-0 text-red-400"
            />

            <p className="text-sm text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-auto text-zinc-600 hover:text-white"
            >
              <X size={16} />
            </button>

          </div>
        )}

        {/* STATS */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Total Warehouses"
            value={warehouses.length}
            description="Configured locations"
            icon={Warehouse}
          />

          <StatCard
            label="Active"
            value={activeCount}
            description="Available for stock"
            icon={CheckCircle2}
          />

          <StatCard
            label="Inactive"
            value={inactiveCount}
            description="Currently disabled"
            icon={Power}
          />

          <StatCard
            label="Inventory Locations"
            value={inventoryLocations}
            description="Part-location records"
            icon={Package}
          />

        </section>

        {/* ADD / EDIT FORM */}
        {showForm && (
          <section className="mb-8 rounded-2xl border border-white/8 bg-[#0e1117] p-6">

            <div className="mb-6 flex items-start justify-between">

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e5253f]" />

                  <p className="font-technical text-[10px] uppercase tracking-[0.2em] text-[#e5253f]">
                    Warehouse Configuration
                  </p>
                </div>

                <h2 className="font-technical text-lg font-semibold uppercase tracking-wider text-white">
                  {editingId
                    ? "Edit Warehouse"
                    : "Add Warehouse"}
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Define the physical storage
                  location used by AutoCore
                  inventory.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 text-zinc-600 transition hover:bg-white/5 hover:text-white"
              >
                <X size={17} />
              </button>

            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-sm text-red-400">
                  {error}
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <FormInput
                  label="Warehouse Code *"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. WH-01"
                />

                <FormInput
                  label="Warehouse Name *"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Main Parts Warehouse"
                />

                <FormInput
                  label="Zone"
                  name="zone"
                  value={form.zone}
                  onChange={handleChange}
                  placeholder="e.g. A-Block"
                />

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-medium text-zinc-400">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    rows={3}
                    placeholder="Describe this warehouse or storage area..."
                    className="w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#e5253f]/50"
                  />
                </div>

              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-white/8 bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-400 transition hover:border-white/15 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-red rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Warehouse"}
                </button>

              </div>
            </form>
          </section>
        )}

        {/* SEARCH */}
        <section className="mb-5 rounded-2xl border border-white/8 bg-[#0e1117] p-4">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search warehouse code, name or zone..."
              className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] pl-11 pr-10 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#e5253f]/50"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
              >
                <X size={16} />
              </button>
            )}

          </div>
        </section>

        {/* TABLE */}
        <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0e1117]">

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

                <p className="font-technical text-sm uppercase tracking-wider text-zinc-500">
                  Loading warehouses...
                </p>

              </div>

            </div>
          ) : filteredWarehouses.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-zinc-600">
                <Warehouse size={25} />
              </div>

              <h3 className="font-technical text-lg font-semibold text-white">
                No warehouses found
              </h3>

              <p className="mt-2 max-w-md text-sm text-zinc-600">
                {search
                  ? "No warehouses match your search."
                  : "No warehouses have been created yet."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="btn-red mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold"
                >
                  Add First Warehouse
                </button>
              )}

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] text-left">

                <thead className="border-b border-white/8 bg-white/[0.02]">

                  <tr className="font-technical text-[10px] uppercase tracking-[0.16em] text-zinc-600">

                    <th className="px-5 py-4">
                      Warehouse
                    </th>

                    <th className="px-5 py-4">
                      Zone
                    </th>

                    <th className="px-5 py-4">
                      Inventory
                    </th>

                    <th className="px-5 py-4">
                      Transactions
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredWarehouses.map(
                    (warehouse) => (
                      <tr
                        key={
                          warehouse.id
                        }
                        className="border-b border-white/6 transition hover:bg-white/[0.025]"
                      >

                        {/* WAREHOUSE */}
                        <td className="px-5 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-[#080a0e] text-zinc-500">
                              <Warehouse
                                size={19}
                              />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">

                                <p className="font-medium text-white">
                                  {
                                    warehouse.name
                                  }
                                </p>

                                <span className="rounded-md border border-white/8 bg-white/[0.04] px-2 py-0.5 font-technical text-[10px] text-zinc-500">
                                  {
                                    warehouse.code
                                  }
                                </span>

                              </div>

                              {warehouse.description && (
                                <p className="mt-1 max-w-md text-xs text-zinc-600">
                                  {
                                    warehouse.description
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* ZONE */}
                        <td className="px-5 py-5">

                          {warehouse.zone ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-400">

                              <MapPin
                                size={14}
                                className="text-zinc-600"
                              />

                              {
                                warehouse.zone
                              }

                            </div>
                          ) : (
                            <span className="text-xs text-zinc-700">
                              No zone
                            </span>
                          )}

                        </td>

                        {/* INVENTORY */}
                        <td className="px-5 py-5">

                          <div className="flex items-center gap-2">

                            <Package
                              size={15}
                              className="text-zinc-600"
                            />

                            <span className="font-technical text-sm text-zinc-300">
                              {
                                warehouse
                                  ._count
                                  .inventory
                              }
                            </span>

                            <span className="text-xs text-zinc-600">
                              records
                            </span>

                          </div>

                        </td>

                        {/* TRANSACTIONS */}
                        <td className="px-5 py-5">

                          <span className="font-technical text-sm text-zinc-400">
                            {
                              warehouse
                                ._count
                                .stockTransactions
                            }
                          </span>

                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-5">

                          {warehouse.isActive ? (
                            <span className="inline-flex items-center gap-2 rounded-lg border border-[#35c98a]/15 bg-[#35c98a]/5 px-2.5 py-1.5 text-xs text-[#35c98a]">

                              <span className="h-1.5 w-1.5 rounded-full bg-[#35c98a]" />

                              Active

                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-600">

                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />

                              Inactive

                            </span>
                          )}

                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-5">

                          <div className="flex justify-end gap-1">

                            <button
                              type="button"
                              title="Edit warehouse"
                              onClick={() =>
                                openEditForm(
                                  warehouse
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/5 hover:text-[#ff334d]"
                            >
                              <Edit3
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              title={
                                warehouse.isActive
                                  ? "Deactivate warehouse"
                                  : "Activate warehouse"
                              }
                              onClick={() =>
                                toggleWarehouse(
                                  warehouse
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/5 hover:text-white"
                            >
                              <Power
                                size={15}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* DATABASE STATUS */}
        <div className="mt-5 flex items-center gap-2 text-xs text-zinc-600">

          <span className="h-1.5 w-1.5 rounded-full bg-[#35c98a] shadow-[0_0_8px_rgba(53,201,138,0.7)]" />

          Live warehouse data from AutoCore database

        </div>

      </div>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="interactive-surface group rounded-2xl border border-white/8 bg-[#0e1117] p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="font-technical text-[11px] uppercase tracking-[0.16em] text-zinc-600">
            {label}
          </p>

          <p className="mt-2 font-technical text-3xl font-semibold text-white">
            {value.toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            {description}
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

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  placeholder?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#e5253f]/50"
      />

    </div>
  );
}