"use client";

import DashboardLayout from "../../components/layout/dashboard-layout";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  name: string;
};

type WarehouseLocation = {
  id: string;
  code: string;
  name: string;
};

type Part = {
  id: string;
  partNumber: string;
  name: string;
  costPrice: string | number;
  sellingPrice: string | number;
  inventory: {
    id: string;
    locationId: string;
    quantity: number;
    reservedQuantity: number;
  }[];
};

type SaleItem = {
  partId: string;
  quantity: number;
  unitPrice: number;
};

export default function NewSalePage() {
  const router = useRouter();

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [locations, setLocations] =
    useState<WarehouseLocation[]>([]);

  const [parts, setParts] =
    useState<Part[]>([]);

  const [customerId, setCustomerId] =
    useState("");

  const [locationId, setLocationId] =
    useState("");

  const [selectedPartId, setSelectedPartId] =
    useState("");

  const [quantity, setQuantity] =
    useState("1");

  const [unitPrice, setUnitPrice] =
    useState("");

  const [items, setItems] =
    useState<SaleItem[]>([]);

  const [discount, setDiscount] =
    useState("0");

  const [tax, setTax] =
    useState("0");

  const [paymentStatus, setPaymentStatus] =
    useState("PAID");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadSaleData();
  }, []);

  async function loadSaleData() {
    try {
      setLoading(true);
      setError("");

      const [
        customersResponse,
        locationsResponse,
        partsResponse,
      ] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/warehouse-locations"),
        fetch("/api/parts"),
      ]);

      if (
        !customersResponse.ok ||
        !locationsResponse.ok ||
        !partsResponse.ok
      ) {
        throw new Error(
          "Failed to load sales data."
        );
      }

      const customersData =
        await customersResponse.json();

      const locationsData =
        await locationsResponse.json();

      const partsData =
        await partsResponse.json();

      setCustomers(customersData);
      setLocations(locationsData);
      setParts(partsData);

      if (
        locationsData.length > 0
      ) {
        setLocationId(
          locationsData[0].id
        );
      }
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load customers, warehouses or parts."
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedPart =
    parts.find(
      (part) =>
        part.id === selectedPartId
    );

  const selectedInventory =
    selectedPart?.inventory.find(
      (inventory) =>
        inventory.locationId ===
        locationId
    );

  const availableStock =
    selectedInventory
      ? Math.max(
          0,
          selectedInventory.quantity -
            selectedInventory.reservedQuantity
        )
      : 0;

  function handlePartChange(
    partId: string
  ) {
    setSelectedPartId(partId);

    const part = parts.find(
      (item) =>
        item.id === partId
    );

    if (part) {
      setUnitPrice(
        Number(
          part.sellingPrice
        ).toString()
      );
    } else {
      setUnitPrice("");
    }

    setQuantity("1");
    setError("");
  }

  function addItem() {
    setError("");

    if (!selectedPart) {
      setError(
        "Please select a part."
      );
      return;
    }

    if (!locationId) {
      setError(
        "Please select a warehouse."
      );
      return;
    }

    const parsedQuantity =
      Number(quantity);

    const parsedPrice =
      Number(unitPrice);

    if (
      !Number.isInteger(
        parsedQuantity
      ) ||
      parsedQuantity <= 0
    ) {
      setError(
        "Quantity must be a positive whole number."
      );
      return;
    }

    if (
      !Number.isFinite(
        parsedPrice
      ) ||
      parsedPrice <= 0
    ) {
      setError(
        "Selling price must be greater than zero."
      );
      return;
    }

    if (availableStock <= 0) {
      setError(
        "This part is out of stock."
      );
      return;
    }

    if (
      parsedQuantity >
      availableStock
    ) {
      setError(
        `Only ${availableStock} unit(s) are available.`
      );
      return;
    }

    const existingItem =
      items.find(
        (item) =>
          item.partId ===
          selectedPart.id
      );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity +
        parsedQuantity;

      if (
        newQuantity >
        availableStock
      ) {
        setError(
          `Maximum available stock is ${availableStock}.`
        );
        return;
      }

      setItems(
        items.map((item) =>
          item.partId ===
          selectedPart.id
            ? {
                ...item,
                quantity:
                  newQuantity,
                unitPrice:
                  parsedPrice,
              }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          partId:
            selectedPart.id,
          quantity:
            parsedQuantity,
          unitPrice:
            parsedPrice,
        },
      ]);
    }

    setSelectedPartId("");
    setQuantity("1");
    setUnitPrice("");
  }

  function removeItem(
    partId: string
  ) {
    setItems(
      items.filter(
        (item) =>
          item.partId !==
          partId
      )
    );
  }

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          item.quantity *
            item.unitPrice,
        0
      ),
    [items]
  );

  const discountAmount =
    Math.max(
      0,
      Number(discount) || 0
    );

  const taxAmount =
    Math.max(
      0,
      Number(tax) || 0
    );

  const total = Math.max(
    0,
    subtotal -
      discountAmount +
      taxAmount
  );

  const estimatedProfit =
    useMemo(() => {
      return items.reduce(
        (profit, item) => {
          const part =
            parts.find(
              (databasePart) =>
                databasePart.id ===
                item.partId
            );

          if (!part) {
            return profit;
          }

          const cost =
            Number(
              part.costPrice
            );

          return (
            profit +
            item.quantity *
              (item.unitPrice -
                cost)
          );
        },
        0
      );
    }, [items, parts]);

  async function createSale() {
    setError("");

    if (!locationId) {
      setError(
        "Please select a warehouse."
      );
      return;
    }

    if (items.length === 0) {
      setError(
        "Please add at least one part."
      );
      return;
    }

    if (
      discountAmount >
      subtotal
    ) {
      setError(
        "Discount cannot be greater than subtotal."
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/sales",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              customerId:
                customerId ||
                null,
              locationId,
              discount:
                discountAmount,
              tax: taxAmount,
              paymentStatus,
              items,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create sale."
        );
      }

      router.push("/sales");
      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create sale."
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
              Loading sales data...
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e5253f]">
              AutoCore / Sales
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-wide text-white">
              NEW SALE
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Create a customer sale, select
              warehouse stock and generate an
              invoice transaction.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/sales")
            }
            className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            ← Back to Sales
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* CUSTOMER / WAREHOUSE */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-white/10 bg-[#0e1117] p-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Customer
            </label>

            <select
              value={customerId}
              onChange={(event) =>
                setCustomerId(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
            >
              <option value="">
                Walk-in Customer
              </option>

              {customers.map(
                (customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0e1117] p-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Warehouse
            </label>

            <select
              value={locationId}
              onChange={(event) => {
                setLocationId(
                  event.target.value
                );

                setSelectedPartId(
                  ""
                );

                setUnitPrice("");

                setError("");
              }}
              className="w-full rounded-xl border border-white/10 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
            >
              <option value="">
                Select warehouse
              </option>

              {locations.map(
                (location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.code} —{" "}
                    {location.name}
                  </option>
                )
              )}
            </select>
          </div>

        </div>

        {/* ADD PART */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#0e1117] p-6">

          <div className="mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Add Parts
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Only available stock from the
              selected warehouse can be sold.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_120px_150px_100px]">

            <select
              value={selectedPartId}
              onChange={(event) =>
                handlePartChange(
                  event.target.value
                )
              }
              className="min-w-0 rounded-xl border border-white/10 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
            >
              <option value="">
                Select part
              </option>

              {parts.map((part) => {
                const inventory =
                  part.inventory.find(
                    (item) =>
                      item.locationId ===
                      locationId
                  );

                const available =
                  Math.max(
                    0,
                    (inventory?.quantity ??
                      0) -
                      (inventory?.reservedQuantity ??
                        0)
                  );

                return (
                  <option
                    key={part.id}
                    value={part.id}
                    disabled={
                      available <= 0
                    }
                  >
                    {part.partNumber} —{" "}
                    {part.name} | Stock:{" "}
                    {available}
                  </option>
                );
              })}
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
              className="rounded-xl border border-white/10 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
            />

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={unitPrice}
              onChange={(event) =>
                setUnitPrice(
                  event.target.value
                )
              }
              placeholder="Selling price"
              className="rounded-xl border border-white/10 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
            />

            <button
              type="button"
              onClick={addItem}
              className="rounded-xl bg-[#e5253f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d]"
            >
              + Add
            </button>
          </div>

          {selectedPart && (
            <div className="mt-4 flex flex-wrap gap-5 text-xs text-zinc-500">
              <span>
                Cost: $
                {Number(
                  selectedPart.costPrice
                ).toFixed(2)}
              </span>

              <span>
                Default Price: $
                {Number(
                  selectedPart.sellingPrice
                ).toFixed(2)}
              </span>

              <span>
                Available:{" "}
                <strong className="text-white">
                  {availableStock}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* ITEMS */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0e1117]">

          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Sale Items
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
              <table className="w-full min-w-[700px] text-sm">

                <thead className="bg-white/[0.02]">
                  <tr className="text-xs uppercase tracking-wider text-zinc-600">
                    <th className="px-6 py-4 text-left">
                      Part
                    </th>

                    <th className="px-6 py-4 text-right">
                      Qty
                    </th>

                    <th className="px-6 py-4 text-right">
                      Unit Price
                    </th>

                    <th className="px-6 py-4 text-right">
                      Line Total
                    </th>

                    <th className="px-6 py-4" />
                  </tr>
                </thead>

                <tbody>
                  {items.map(
                    (item) => {
                      const part =
                        parts.find(
                          (databasePart) =>
                            databasePart.id ===
                            item.partId
                        );

                      return (
                        <tr
                          key={
                            item.partId
                          }
                          className="border-t border-white/6"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-white">
                              {part?.name}
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              {
                                part?.partNumber
                              }
                            </p>
                          </td>

                          <td className="px-6 py-4 text-right text-zinc-300">
                            {
                              item.quantity
                            }
                          </td>

                          <td className="px-6 py-4 text-right text-zinc-300">
                            $
                            {item.unitPrice.toFixed(
                              2
                            )}
                          </td>

                          <td className="px-6 py-4 text-right font-medium text-white">
                            $
                            {(
                              item.quantity *
                              item.unitPrice
                            ).toFixed(
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

        {/* BOTTOM */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* PAYMENT */}
          <div className="rounded-2xl border border-white/10 bg-[#0e1117] p-6">

            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Payment
            </h2>

            <label className="mb-2 block text-xs text-zinc-500">
              Payment Status
            </label>

            <select
              value={paymentStatus}
              onChange={(event) =>
                setPaymentStatus(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
            >
              <option value="PAID">
                Paid
              </option>

              <option value="PARTIAL">
                Partial
              </option>

              <option value="PENDING">
                Pending
              </option>
            </select>

            <div className="mt-5 grid grid-cols-2 gap-4">

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
                  className="w-full rounded-xl border border-white/10 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
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
                  className="w-full rounded-xl border border-white/10 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
                />
              </div>

            </div>
          </div>

          {/* SUMMARY */}
          <div className="rounded-2xl border border-white/10 bg-[#0e1117] p-6">

            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Sale Summary
            </h2>

            <div className="space-y-3 text-sm">

              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>

                <span>
                  $
                  {subtotal.toFixed(
                    2
                  )}
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
                    {total.toFixed(
                      2
                    )}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">
                    Estimated Profit
                  </span>

                  <span className="font-semibold text-emerald-400">
                    $
                    {estimatedProfit.toFixed(
                      2
                    )}
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
              router.push("/sales")
            }
            disabled={saving}
            className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={createSale}
            disabled={
              saving ||
              items.length === 0
            }
            className="rounded-xl bg-[#e5253f] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? "Processing..."
              : "Complete Sale"}
          </button>

        </div>
      </div>
    </DashboardLayout>
  );
}