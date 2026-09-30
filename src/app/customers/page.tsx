"use client";

import DashboardLayout from "../components/layout/dashboard-layout";
import ModulePage from "../components/layout/module-page";
import { useEffect, useState } from "react";

type ApiCustomer = {
  id: string;
  customerCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  taxNumber: string | null;
  notes: string | null;
  isActive: boolean;

  sales: {
    id: string;
    total: string | number;
    status: string;
  }[];
};

type CustomerRow = {
  ID: string;
  Customer: string;
  Phone: string;
  Email: string;
  Purchases: string;
  Spent: string;
};

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  taxNumber: string;
  notes: string;
};

const emptyForm: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  taxNumber: "",
  notes: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/customers");

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data: ApiCustomer[] = await response.json();

      const formattedCustomers: CustomerRow[] = data.map(
        (customer) => {
          const completedSales = customer.sales.filter(
            (sale) =>
              sale.status !== "CANCELLED" &&
              sale.status !== "DRAFT"
          );

          const totalSpent = completedSales.reduce(
            (total, sale) =>
              total + Number(sale.total),
            0
          );

          return {
            ID: customer.customerCode,
            Customer: customer.name,
            Phone: customer.phone ?? "N/A",
            Email: customer.email ?? "N/A",
            Purchases: completedSales.length.toString(),
            Spent: `$${totalSpent.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          };
        }
      );

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error(
        "Failed to load customers:",
        error
      );

      setError(
        "Unable to load customers from database."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function updateField(
    field: keyof CustomerForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleAddCustomer() {
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          taxNumber: form.taxNumber.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to create customer"
        );
      }

      setForm(emptyForm);
      setShowModal(false);

      await loadCustomers();
    } catch (error) {
      console.error(
        "Failed to create customer:",
        error
      );

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create customer."
      );
    } finally {
      setSaving(false);
    }
  }

  const totalCustomers = customers.length;

  const totalSales = customers.reduce(
    (total, customer) => {
      return (
        total +
        Number(
          customer.Spent
            .replace("$", "")
            .replace(/,/g, "")
        )
      );
    },
    0
  );

  const newCustomers = customers.length;
  const activeCustomers = customers.length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

            <p className="text-sm text-zinc-400">
              Loading customer database...
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
              onClick={loadCustomers}
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
      <div className="relative">
        <ModulePage
          eyebrow="Customers"
          title="CUSTOMER MANAGEMENT"
          description="Manage customer records, contact information, purchase history and account activity."
          buttonText="Add Customer"
          onButtonClick={() => {
            setForm(emptyForm);
            setFormError("");
            setShowModal(true);
          }}
          searchPlaceholder="Search customer, phone or email..."
          columns={[
            "ID",
            "Customer",
            "Phone",
            "Email",
            "Purchases",
            "Spent",
          ]}
          data={customers}
          stats={[
            {
              label: "Customers",
              value: totalCustomers.toString(),
              description: "Registered customers",
            },
            {
              label: "New Customers",
              value: newCustomers.toString(),
              description: "Currently registered",
            },
            {
              label: "Active Accounts",
              value: activeCustomers.toString(),
              description: "Active customers",
            },
            {
              label: "Customer Sales",
              value: `$${totalSales.toLocaleString()}`,
              description: "Recorded sales",
            },
          ]}
        />

        {/* ADD CUSTOMER MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0e1117] shadow-2xl">
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
                <div>
                  <p className="font-technical text-[10px] uppercase tracking-[0.2em] text-[#e5253f]">
                    AutoCore / Customers
                  </p>

                  <h2 className="font-display mt-1 text-3xl tracking-wide text-white">
                    ADD CUSTOMER
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 text-zinc-500 transition hover:border-white/15 hover:text-white"
                >
                  ×
                </button>
              </div>

              {/* FORM */}
              <div className="max-h-[70vh] overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Customer Name"
                    required
                    value={form.name}
                    onChange={(value) =>
                      updateField("name", value)
                    }
                    placeholder="Muhammad Hamza"
                  />

                  <FormField
                    label="Phone"
                    value={form.phone}
                    onChange={(value) =>
                      updateField("phone", value)
                    }
                    placeholder="0300-1234567"
                  />

                  <FormField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      updateField("email", value)
                    }
                    placeholder="customer@example.com"
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
                    placeholder="Optional"
                  />

                  <FormField
                    label="Address"
                    value={form.address}
                    onChange={(value) =>
                      updateField("address", value)
                    }
                    placeholder="Customer address"
                  />
                </div>

                <div className="mt-4">
                  <label className="font-technical text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateField(
                        "notes",
                        event.target.value
                      )
                    }
                    placeholder="Additional customer information..."
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-white/8 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#e5253f]/50"
                  />
                </div>

                {formError && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {formError}
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-3 border-t border-white/8 px-6 py-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-white/8 px-5 py-2.5 text-sm text-zinc-400 transition hover:border-white/15 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleAddCustomer}
                  className="btn-red rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Create Customer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="font-technical text-[10px] uppercase tracking-[0.15em] text-zinc-500">
        {label}

        {required && (
          <span className="ml-1 text-[#e5253f]">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#e5253f]/50"
      />
    </div>
  );
}