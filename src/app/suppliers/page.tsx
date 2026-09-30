"use client";

import DashboardLayout from "../components/layout/dashboard-layout";
import ModulePage from "../components/layout/module-page";
import { useEffect, useState } from "react";

type ApiSupplier = {
  id: string;
  supplierCode: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  taxNumber: string | null;
  notes: string | null;
  isActive: boolean;
  purchases: {
    id: string;
    total: string | number;
    status: string;
  }[];
};

type SupplierRow = {
  ID: string;
  Supplier: string;
  Contact: string;
  Phone: string;
  Products: string;
  Balance: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    supplierCode: "",
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    taxNumber: "",
    notes: "",
  });

  async function loadSuppliers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/suppliers");

      if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
      }

      const data: ApiSupplier[] = await response.json();

      const formattedSuppliers: SupplierRow[] = data.map(
        (supplier) => {
          const outstandingBalance = supplier.purchases
            .filter(
              (purchase) =>
                purchase.status !== "CANCELLED" &&
                purchase.status !== "RECEIVED"
            )
            .reduce(
              (total, purchase) =>
                total + Number(purchase.total),
              0
            );

          return {
            ID: supplier.supplierCode,
            Supplier: supplier.name,
            Contact: supplier.contactName ?? "N/A",
            Phone: supplier.phone ?? "N/A",
            Products: "—",
            Balance:
              outstandingBalance > 0
                ? `$${outstandingBalance.toLocaleString()}`
                : "$0",
          };
        }
      );

      setSuppliers(formattedSuppliers);
    } catch (error) {
      console.error("Failed to load suppliers:", error);
      setError("Unable to load suppliers from database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleAddSupplier() {
    setFormError("");

    if (!form.supplierCode.trim()) {
      setFormError("Supplier code is required.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Supplier name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplierCode: form.supplierCode.trim(),
          name: form.name.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          taxNumber: form.taxNumber.trim(),
          notes: form.notes.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to create supplier."
        );
      }

      setForm({
        supplierCode: "",
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        taxNumber: "",
        notes: "",
      });

      setShowModal(false);

      await loadSuppliers();
    } catch (error) {
      console.error("Failed to create supplier:", error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create supplier."
      );
    } finally {
      setSaving(false);
    }
  }

  const activeSuppliers = suppliers.length;

  const outstanding = suppliers.reduce((total, supplier) => {
    return (
      total +
      Number(
        supplier.Balance
          .replace("$", "")
          .replace(/,/g, "")
      )
    );
  }, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

            <p className="text-sm text-zinc-400">
              Loading supplier database...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-8 py-6 text-center">
            <p className="text-sm font-medium text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-[#e5253f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#ff334d]"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ModulePage
        eyebrow="Suppliers"
        title="SUPPLIER MANAGEMENT"
        description="Manage automotive suppliers, contacts, supplied products and outstanding balances."
        buttonText="Add Supplier"
        onButtonClick={() => {
          setFormError("");
          setShowModal(true);
        }}
        searchPlaceholder="Search supplier, contact or phone..."
        columns={[
          "ID",
          "Supplier",
          "Contact",
          "Phone",
          "Products",
          "Balance",
        ]}
        data={suppliers}
        stats={[
          {
            label: "Total Suppliers",
            value: suppliers.length.toString(),
            description: "Registered suppliers",
          },
          {
            label: "Active Suppliers",
            value: activeSuppliers.toString(),
            description: "Currently supplying",
          },
          {
            label: "Purchase Orders",
            value: "—",
            description: "Tracked supplier activity",
          },
          {
            label: "Outstanding",
            value: `$${outstanding.toLocaleString()}`,
            description: "Supplier balances",
          },
        ]}
      />

      {/* ADD SUPPLIER MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0e1117] shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
              <div>
                <p className="font-technical text-[10px] uppercase tracking-[0.2em] text-[#e5253f]">
                  AutoCore / Suppliers
                </p>

                <h2 className="mt-1 font-display text-3xl tracking-wide text-white">
                  ADD SUPPLIER
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-2xl text-zinc-600 transition hover:text-white"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <div className="max-h-[70vh] overflow-y-auto p-6">
              {formError && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="Supplier Code *"
                  value={form.supplierCode}
                  onChange={(value) =>
                    updateField("supplierCode", value)
                  }
                  placeholder="SUP-001"
                />

                <FormField
                  label="Supplier Name *"
                  value={form.name}
                  onChange={(value) =>
                    updateField("name", value)
                  }
                  placeholder="ABC Auto Parts"
                />

                <FormField
                  label="Contact Person"
                  value={form.contactName}
                  onChange={(value) =>
                    updateField("contactName", value)
                  }
                  placeholder="Muhammad Ali"
                />

                <FormField
                  label="Phone"
                  value={form.phone}
                  onChange={(value) =>
                    updateField("phone", value)
                  }
                  placeholder="+92 300 1234567"
                />

                <FormField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateField("email", value)
                  }
                  placeholder="supplier@example.com"
                />

                <FormField
                  label="City"
                  value={form.city}
                  onChange={(value) =>
                    updateField("city", value)
                  }
                  placeholder="Rawalpindi"
                />

                <FormField
                  label="Tax Number"
                  value={form.taxNumber}
                  onChange={(value) =>
                    updateField("taxNumber", value)
                  }
                  placeholder="NTN / Tax number"
                />

                <FormField
                  label="Address"
                  value={form.address}
                  onChange={(value) =>
                    updateField("address", value)
                  }
                  placeholder="Supplier address"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateField("notes", event.target.value)
                  }
                  placeholder="Additional supplier information..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/8 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#e5253f]/50"
                />
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-white/8 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-white/8 px-5 py-3 text-sm text-zinc-400 transition hover:border-white/15 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddSupplier}
                disabled={saving}
                className="btn-red rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#e5253f]/50"
      />
    </div>
  );
}