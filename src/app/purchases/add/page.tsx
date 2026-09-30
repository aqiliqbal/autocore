"use client";

import DashboardLayout from "../../components/layout/dashboard-layout";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Supplier = {
  id: string;
  name: string;
};

type Part = {
  id: string;
  partNumber: string;
  name: string;
  costPrice: string | number;
};

type PurchaseItem = {
  partId: string;
  quantity: number;
  unitCost: number;
};

export default function NewPurchasePage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedPart, setSelectedPart] = useState("");

  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");

  const [items, setItems] = useState<PurchaseItem[]>([]);

  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPurchaseData();
  }, []);

  async function loadPurchaseData() {
    try {
      setLoading(true);
      setError("");

      const [supplierResponse, partsResponse] =
        await Promise.all([
          fetch("/api/suppliers"),
          fetch("/api/parts"),
        ]);

      if (
        !supplierResponse.ok ||
        !partsResponse.ok
      ) {
        throw new Error(
          "Failed to load suppliers or parts."
        );
      }

      const supplierData =
        await supplierResponse.json();

      const partsData =
        await partsResponse.json();

      setSuppliers(
        supplierData.map(
          (supplier: any) => ({
            id: supplier.id,
            name: supplier.name,
          })
        )
      );

      setParts(
        partsData.map(
          (part: any) => ({
            id: part.id,
            partNumber: part.partNumber,
            name: part.name,
            costPrice: part.costPrice,
          })
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load suppliers or parts."
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePartChange(partId: string) {
    setSelectedPart(partId);

    const part = parts.find(
      (item) => item.id === partId
    );

    if (part) {
      setUnitCost(
        Number(part.costPrice).toString()
      );
    } else {
      setUnitCost("");
    }
  }

  function addItem() {
    setError("");

    if (!selectedPart) {
      setError("Please select a part.");
      return;
    }

    const parsedQuantity = Number(quantity);
    const parsedUnitCost = Number(unitCost);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError(
        "Quantity must be a positive whole number."
      );
      return;
    }

    if (
      !Number.isFinite(parsedUnitCost) ||
      parsedUnitCost <= 0
    ) {
      setError(
        "Unit cost must be greater than zero."
      );
      return;
    }

    const existingItem = items.find(
      (item) =>
        item.partId === selectedPart
    );

    if (existingItem) {
      setItems(
        items.map((item) =>
          item.partId === selectedPart
            ? {
                ...item,
                quantity:
                  item.quantity +
                  parsedQuantity,
                unitCost:
                  parsedUnitCost,
              }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          partId: selectedPart,
          quantity: parsedQuantity,
          unitCost: parsedUnitCost,
        },
      ]);
    }

    setSelectedPart("");
    setQuantity("1");
    setUnitCost("");
  }

  function removeItem(partId: string) {
    setItems(
      items.filter(
        (item) =>
          item.partId !== partId
      )
    );
  }

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        item.quantity *
          item.unitCost,
      0
    );
  }, [items]);

  const discountAmount = Math.max(
    0,
    Number(discount) || 0
  );

  const taxAmount = Math.max(
    0,
    Number(tax) || 0
  );

  const total = Math.max(
    0,
    subtotal -
      discountAmount +
      taxAmount
  );

  async function createPurchase() {
    setError("");

    if (!selectedSupplier) {
      setError(
        "Please select a supplier."
      );
      return;
    }

    if (items.length === 0) {
      setError(
        "Please add at least one part."
      );
      return;
    }

    if (discountAmount > subtotal) {
      setError(
        "Discount cannot be greater than subtotal."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/purchases",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            supplierId:
              selectedSupplier,
            discount:
              discountAmount,
            tax: taxAmount,
            items,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to create purchase."
        );
      }

      router.push("/purchases");
      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create purchase."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

            <p className="text-sm text-zinc-400">
              Loading purchase data...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="font-technical text-xs uppercase tracking-[0.2em] text-[#e5253f]">
              AutoCore / Procurement
            </p>

            <h1 className="mt-2 font-display text-4xl tracking-wide text-white">
              NEW PURCHASE ORDER
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Create a supplier purchase order and
              add incoming automotive parts.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/purchases")
            }
            className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            ← Back to Purchases
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* SUPPLIER */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#0e1117] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Purchase Information
          </h2>

          <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
            Supplier
          </label>

          <select
            value={selectedSupplier}
            onChange={(event) =>
              setSelectedSupplier(
                event.target.value
              )
            }
            className="h-12 w-full rounded-xl border border-white/10 bg-[#080a0e] px-4 text-sm text-white outline-none focus:border-[#e5253f]/50"
          >
            <option value="">
              Select supplier
            </option>

            {suppliers.map(
              (supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
                </option>
              )
            )}
          </select>
        </div>

        {/* ADD PART */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#0e1117] p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Add Parts
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Add the parts you are purchasing
              from the supplier.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_130px_160px_100px]">

            <select
              value={selectedPart}
              onChange={(event) =>
                handlePartChange(
                  event.target.value
                )
              }
              className="h-12 min-w-0 rounded-xl border border-white/10 bg-[#080a0e] px-4 text-sm text-white outline-none focus:border-[#e5253f]/50"
            >
              <option value="">
                Select part
              </option>

              {parts.map((part) => (
                <option
                  key={part.id}
                  value={part.id}
                >
                  {part.partNumber} —{" "}
                  {part.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target.value
                )
              }
              placeholder="Quantity"
              className="h-12 rounded-xl border border-white/10 bg-[#080a0e] px-4 text-sm text-white outline-none focus:border-[#e5253f]/50"
            />

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={unitCost}
              onChange={(event) =>
                setUnitCost(
                  event.target.value
                )
              }
              placeholder="Unit cost"
              className="h-12 rounded-xl border border-white/10 bg-[#080a0e] px-4 text-sm text-white outline-none focus:border-[#e5253f]/50"
            />

            <button
              type="button"
              onClick={addItem}
              className="rounded-xl bg-[#e5253f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d]"
            >
              + Add
            </button>
          </div>
        </div>

        {/* ITEMS */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0e1117]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Purchase Items
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-zinc-600">
                No parts added yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-white/[0.02]">
                  <tr className="text-xs uppercase tracking-wider text-zinc-600">
                    <th className="px-6 py-4">
                      Part
                    </th>

                    <th className="px-6 py-4">
                      Quantity
                    </th>

                    <th className="px-6 py-4">
                      Unit Cost
                    </th>

                    <th className="px-6 py-4">
                      Total
                    </th>

                    <th className="px-6 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(
                    (item) => {
                      const part =
                        parts.find(
                          (p) =>
                            p.id ===
                            item.partId
                        );

                      const lineTotal =
                        item.quantity *
                        item.unitCost;

                      return (
                        <tr
                          key={
                            item.partId
                          }
                          className="border-t border-white/6"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-white">
                              {part?.name}
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              {
                                part?.partNumber
                              }
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm text-zinc-300">
                            {
                              item.quantity
                            }
                          </td>

                          <td className="px-6 py-4 text-sm text-zinc-300">
                            $
                            {item.unitCost.toFixed(
                              2
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm font-medium text-white">
                            $
                            {lineTotal.toFixed(
                              2
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  item.partId
                                )
                              }
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TOTALS */}
        <div className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-white/10 bg-[#0e1117] p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Adjustments
            </h2>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="mb-2 block text-xs text-zinc-500">
                  Discount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(event) =>
                    setDiscount(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-zinc-500">
                  Tax
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tax}
                  onChange={(event) =>
                    setTax(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]/50"
                />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0e1117] p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Purchase Summary
            </h2>

            <div className="space-y-3 text-sm">

              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>

                <span>
                  $
                  {subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-zinc-500">
                <span>Discount</span>

                <span>
                  -$
                  {discountAmount.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="flex justify-between text-zinc-500">
                <span>Tax</span>

                <span>
                  +$
                  {taxAmount.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold text-white">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-[#ff334d]">
                    $
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-6">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/purchases"
              )
            }
            disabled={saving}
            className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={createPurchase}
            disabled={
              saving ||
              items.length === 0
            }
            className="rounded-xl bg-[#e5253f] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? "Creating..."
              : "Create Purchase Order"}
          </button>

        </div>
      </div>
    </DashboardLayout>
  );
}