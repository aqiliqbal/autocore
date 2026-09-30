"use client";

import DashboardLayout from "../components/layout/dashboard-layout";
import ModulePage from "../components/layout/module-page";
import { useEffect, useState } from "react";

type ApiPurchase = {
  id: string;
  purchaseNumber: string;
  purchaseDate: string;
  status: string;
  total: string | number;

  supplier: {
    name: string;
  };

  items: {
    quantity: number;
  }[];
};

type PurchaseRow = {
  id: string;
  "PO Number": string;
  Supplier: string;
  Date: string;
  Items: string;
  Total: string;
  Status: string;
};

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

type WarehouseLocation = {
  id: string;
  code: string;
  name: string;
};

type PurchaseItem = {
  partId: string;
  quantity: number;
  unitCost: number;
};

function formatStatus(status: string) {
  const names: Record<string, string> = {
    DRAFT: "Draft",
    ORDERED: "Ordered",
    PARTIALLY_RECEIVED: "Partially Received",
    RECEIVED: "Received",
    CANCELLED: "Cancelled",
  };

  return names[status] ?? status;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const [selectedPart, setSelectedPart] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [showReceiveModal, setShowReceiveModal] =
    useState(false);

  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseRow | null>(null);

  const [locations, setLocations] = useState<
    WarehouseLocation[]
  >([]);

  const [selectedLocation, setSelectedLocation] =
    useState("");

  const [receiving, setReceiving] =
    useState(false);

  const [receiveError, setReceiveError] =
    useState("");

  async function loadPurchases() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/purchases");

      if (!response.ok) {
        throw new Error("Failed to fetch purchases");
      }

      const data: ApiPurchase[] =
        await response.json();

      const formattedPurchases: PurchaseRow[] =
        data.map((purchase) => {
          const itemQuantity =
            purchase.items.reduce(
              (total, item) =>
                total + item.quantity,
              0
            );

          return {
            id: purchase.id,
            "PO Number":
              purchase.purchaseNumber,
            Supplier:
              purchase.supplier.name,
            Date: formatDate(
              purchase.purchaseDate
            ),
            Items:
              itemQuantity.toString(),
            Total: `$${Number(
              purchase.total
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            Status: formatStatus(
              purchase.status
            ),
          };
        });

      setPurchases(formattedPurchases);
    } catch (error) {
      console.error(
        "Failed to load purchases:",
        error
      );

      setError(
        "Unable to load purchases from database."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPurchases();
  }, []);

  async function openPurchaseModal() {
    setFormError("");

    try {
      const [
        supplierResponse,
        partsResponse,
      ] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/parts"),
      ]);

      if (
        !supplierResponse.ok ||
        !partsResponse.ok
      ) {
        throw new Error(
          "Failed to load purchase data"
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
        partsData.map((part: any) => ({
          id: part.id,
          partNumber:
            part.partNumber,
          name: part.name,
          costPrice:
            part.costPrice,
        }))
      );

      setShowModal(true);
    } catch (error) {
      console.error(error);

      setFormError(
        "Unable to load suppliers or parts."
      );
    }
  }

  function handlePartChange(
    partId: string
  ) {
    setSelectedPart(partId);

    const part = parts.find(
      (item) => item.id === partId
    );

    if (part) {
      setUnitCost(
        Number(part.costPrice)
      );
    } else {
      setUnitCost(0);
    }
  }

  function addItem() {
    setFormError("");

    if (!selectedPart) {
      setFormError(
        "Please select a part."
      );
      return;
    }

    if (quantity <= 0) {
      setFormError(
        "Quantity must be greater than zero."
      );
      return;
    }

    if (unitCost <= 0) {
      setFormError(
        "Unit cost must be greater than zero."
      );
      return;
    }

    const existingItem =
      items.find(
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
                  quantity,
                unitCost,
              }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          partId:
            selectedPart,
          quantity,
          unitCost,
        },
      ]);
    }

    setSelectedPart("");
    setQuantity(1);
    setUnitCost(0);
  }

  function removeItem(
    partId: string
  ) {
    setItems(
      items.filter(
        (item) =>
          item.partId !== partId
      )
    );
  }

  function getPart(
    partId: string
  ) {
    return parts.find(
      (part) =>
        part.id === partId
    );
  }

  const subtotal = items.reduce(
    (total, item) =>
      total +
      item.quantity *
        item.unitCost,
    0
  );

  const total = Math.max(
    0,
    subtotal -
      discount +
      tax
  );

  async function createPurchase() {
    setFormError("");

    if (!selectedSupplier) {
      setFormError(
        "Please select a supplier."
      );
      return;
    }

    if (items.length === 0) {
      setFormError(
        "Please add at least one part to the purchase."
      );
      return;
    }

    if (
      discount < 0 ||
      tax < 0
    ) {
      setFormError(
        "Discount and tax cannot be negative."
      );
      return;
    }

    if (discount > subtotal) {
      setFormError(
        "Discount cannot be greater than subtotal."
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
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
              discount,
              tax,
              items,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to create purchase"
        );
      }

      setShowModal(false);
      setSelectedSupplier("");
      setItems([]);
      setDiscount(0);
      setTax(0);

      await loadPurchases();
    } catch (error) {
      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create purchase."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openReceiveModal(
    purchase: PurchaseRow
  ) {
    setReceiveError("");

    try {
      const response =
        await fetch(
          "/api/warehouse-locations"
        );

      if (!response.ok) {
        throw new Error(
          "Failed to load warehouse locations."
        );
      }

      const data =
        await response.json();

      setLocations(
        data.map(
          (
            location: any
          ) => ({
            id:
              location.id,
            code:
              location.code,
            name:
              location.name,
          })
        )
      );

      setSelectedPurchase(
        purchase
      );

      setSelectedLocation("");

      setShowReceiveModal(
        true
      );
    } catch (error) {
      console.error(error);

      setReceiveError(
        "Unable to load warehouse locations."
      );
    }
  }

  async function receivePurchase() {
    setReceiveError("");

    if (!selectedPurchase) {
      return;
    }

    if (!selectedLocation) {
      setReceiveError(
        "Please select a warehouse location."
      );
      return;
    }

    try {
      setReceiving(true);

      const response =
        await fetch(
          "/api/purchases",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              purchaseId:
                selectedPurchase.id,
              locationId:
                selectedLocation,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to receive purchase."
        );
      }

      setShowReceiveModal(
        false
      );

      setSelectedPurchase(
        null
      );

      setSelectedLocation("");

      await loadPurchases();
    } catch (error) {
      console.error(error);

      setReceiveError(
        error instanceof Error
          ? error.message
          : "Failed to receive purchase."
      );
    } finally {
      setReceiving(false);
    }
  }

  const totalOrders =
    purchases.length;

  const receivedOrders =
    purchases.filter(
      (purchase) =>
        purchase.Status ===
        "Received"
    ).length;

  const pendingOrders =
    purchases.filter(
      (purchase) =>
        purchase.Status ===
          "Ordered" ||
        purchase.Status ===
          "Partially Received"
    ).length;

  const purchaseValue =
    purchases.reduce(
      (total, purchase) =>
        total +
        Number(
          purchase.Total
            .replace("$", "")
            .replace(
              /,/g,
              ""
            )
        ),
      0
    );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

            <p className="text-sm text-zinc-400">
              Loading purchase database...
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
              onClick={() =>
                window.location.reload()
              }
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
        eyebrow="Purchases"
        title="PURCHASE ORDERS"
        description="Track supplier purchases, incoming stock, purchase costs and receiving status."
        buttonText="New Purchase"
        onButtonClick={
          openPurchaseModal
        }
        searchPlaceholder="Search purchase order, supplier or status..."
        columns={[
          "PO Number",
          "Supplier",
          "Date",
          "Items",
          "Total",
          "Status",
        ]}
        data={purchases}
        renderActions={(row) => {
          const purchase =
            purchases.find(
              (item) =>
                item.id ===
                row.id
            );

          if (
            !purchase
          ) {
            return null;
          }

          if (
            purchase.Status ===
            "Received"
          ) {
            return (
              <span className="inline-flex items-center gap-2 rounded-lg border border-[#35c98a]/20 bg-[#35c98a]/5 px-3 py-1.5 text-xs text-[#35c98a]">
                ✓ Received
              </span>
            );
          }

          if (
            purchase.Status ===
            "Cancelled"
          ) {
            return (
              <span className="text-xs text-zinc-600">
                Cancelled
              </span>
            );
          }

          return (
            <button
              type="button"
              onClick={() =>
                openReceiveModal(
                  purchase
                )
              }
              className="rounded-lg border border-[#e5253f]/30 bg-[#e5253f]/5 px-3 py-1.5 text-xs font-medium text-[#ff465c] transition hover:bg-[#e5253f]/15 hover:text-white"
            >
              Receive
            </button>
          );
        }}
        stats={[
          {
            label:
              "Purchase Orders",
            value:
              totalOrders.toString(),
            description:
              "Registered orders",
          },
          {
            label: "Received",
            value:
              receivedOrders.toString(),
            description:
              "Completed orders",
          },
          {
            label: "Pending",
            value:
              pendingOrders.toString(),
            description:
              "Awaiting delivery",
          },
          {
            label:
              "Purchase Value",
            value: `$${purchaseValue.toLocaleString()}`,
            description:
              "Total purchase value",
          },
        ]}
      />

      {/* NEW PURCHASE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0e1117] shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
              <div>
                <p className="font-technical text-xs uppercase tracking-[0.2em] text-[#e5253f]">
                  AutoCore / Procurement
                </p>

                <h2 className="mt-1 font-display text-3xl tracking-wide text-white">
                  NEW PURCHASE ORDER
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-zinc-500 transition hover:border-white/20 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-6">

              <div>
                <label className="mb-2 block font-technical text-xs uppercase tracking-[0.15em] text-zinc-500">
                  Supplier
                </label>

                <select
                  value={
                    selectedSupplier
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedSupplier(
                      event.target
                        .value
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
                        key={
                          supplier.id
                        }
                        value={
                          supplier.id
                        }
                      >
                        {
                          supplier.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="rounded-2xl border border-white/8 bg-[#080a0e] p-5">
                <div className="mb-4">
                  <h3 className="font-technical text-sm font-semibold uppercase tracking-[0.12em] text-white">
                    Add Parts
                  </h3>

                  <p className="mt-1 text-xs text-zinc-600">
                    Add one or more parts to this purchase order.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_120px_150px_auto]">

                  <select
                    value={
                      selectedPart
                    }
                    onChange={(
                      event
                    ) =>
                      handlePartChange(
                        event.target
                          .value
                      )
                    }
                    className="h-11 rounded-xl border border-white/10 bg-[#0e1117] px-3 text-sm text-white outline-none focus:border-[#e5253f]/50"
                  >
                    <option value="">
                      Select part
                    </option>

                    {parts.map(
                      (part) => (
                        <option
                          key={
                            part.id
                          }
                          value={
                            part.id
                          }
                        >
                          {
                            part.partNumber
                          }{" "}
                          —{" "}
                          {
                            part.name
                          }
                        </option>
                      )
                    )}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={
                      quantity
                    }
                    onChange={(
                      event
                    ) =>
                      setQuantity(
                        Number(
                          event
                            .target
                            .value
                        )
                      )
                    }
                    placeholder="Qty"
                    className="h-11 rounded-xl border border-white/10 bg-[#0e1117] px-3 text-sm text-white outline-none focus:border-[#e5253f]/50"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      unitCost
                    }
                    onChange={(
                      event
                    ) =>
                      setUnitCost(
                        Number(
                          event
                            .target
                            .value
                        )
                      )
                    }
                    placeholder="Unit cost"
                    className="h-11 rounded-xl border border-white/10 bg-[#0e1117] px-3 text-sm text-white outline-none focus:border-[#e5253f]/50"
                  />

                  <button
                    type="button"
                    onClick={
                      addItem
                    }
                    className="btn-red rounded-xl px-5 py-2 text-sm font-semibold"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {items.length >
                0 && (
                <div className="overflow-hidden rounded-2xl border border-white/8">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left">
                      <thead className="border-b border-white/8 bg-white/[0.02]">
                        <tr className="font-technical text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                          <th className="px-4 py-3">
                            Part
                          </th>

                          <th className="px-4 py-3">
                            Qty
                          </th>

                          <th className="px-4 py-3">
                            Unit Cost
                          </th>

                          <th className="px-4 py-3">
                            Line Total
                          </th>

                          <th className="px-4 py-3 text-right">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map(
                          (
                            item
                          ) => {
                            const part =
                              getPart(
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
                                className="border-b border-white/6"
                              >
                                <td className="px-4 py-4">
                                  <p className="text-sm font-medium text-white">
                                    {
                                      part?.name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-600">
                                    {
                                      part?.partNumber
                                    }
                                  </p>
                                </td>

                                <td className="px-4 py-4 text-sm text-zinc-300">
                                  {
                                    item.quantity
                                  }
                                </td>

                                <td className="px-4 py-4 text-sm text-zinc-300">
                                  $
                                  {item.unitCost.toLocaleString()}
                                </td>

                                <td className="px-4 py-4 text-sm font-medium text-white">
                                  $
                                  {lineTotal.toLocaleString()}
                                </td>

                                <td className="px-4 py-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItem(
                                        item.partId
                                      )
                                    }
                                    className="text-xs text-red-400 transition hover:text-red-300"
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
                </div>
              )}

              <div className="ml-auto max-w-sm rounded-2xl border border-white/8 bg-[#080a0e] p-5">

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Subtotal
                  </span>

                  <span className="text-white">
                    $
                    {subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-500">
                    Discount
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      discount
                    }
                    onChange={(
                      event
                    ) =>
                      setDiscount(
                        Number(
                          event
                            .target
                            .value
                        )
                      )
                    }
                    className="h-9 w-28 rounded-lg border border-white/10 bg-[#0e1117] px-3 text-right text-sm text-white outline-none focus:border-[#e5253f]/50"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-500">
                    Tax
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(
                      event
                    ) =>
                      setTax(
                        Number(
                          event
                            .target
                            .value
                        )
                      )
                    }
                    className="h-9 w-28 rounded-lg border border-white/10 bg-[#0e1117] px-3 text-right text-sm text-white outline-none focus:border-[#e5253f]/50"
                  />
                </div>

                <div className="my-4 border-t border-white/8" />

                <div className="flex justify-between">
                  <span className="font-technical text-sm uppercase tracking-wider text-zinc-400">
                    Total
                  </span>

                  <span className="font-technical text-2xl font-semibold text-white">
                    $
                    {total.toLocaleString()}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-white/8 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    createPurchase
                  }
                  disabled={
                    saving
                  }
                  className="btn-red rounded-xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create Purchase Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE PURCHASE MODAL */}
      {showReceiveModal &&
        selectedPurchase && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e1117] shadow-2xl">

              <div className="border-b border-white/8 px-6 py-5">
                <p className="font-technical text-xs uppercase tracking-[0.2em] text-[#e5253f]">
                  AutoCore / Inventory Receiving
                </p>

                <h2 className="mt-1 font-display text-3xl tracking-wide text-white">
                  RECEIVE PURCHASE
                </h2>
              </div>

              <div className="space-y-5 p-6">

                <div className="rounded-xl border border-white/8 bg-[#080a0e] p-4">
                  <div className="flex justify-between">
                    <span className="text-xs uppercase tracking-wider text-zinc-600">
                      Purchase Order
                    </span>

                    <span className="font-technical text-sm font-semibold text-white">
                      {
                        selectedPurchase[
                          "PO Number"
                        ]
                      }
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between">
                    <span className="text-xs uppercase tracking-wider text-zinc-600">
                      Supplier
                    </span>

                    <span className="text-sm text-zinc-300">
                      {
                        selectedPurchase[
                          "Supplier"
                        ]
                      }
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-technical text-xs uppercase tracking-[0.15em] text-zinc-500">
                    Receive Into Warehouse
                  </label>

                  <select
                    value={
                      selectedLocation
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedLocation(
                        event
                          .target
                          .value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#080a0e] px-4 text-sm text-white outline-none focus:border-[#e5253f]/50"
                  >
                    <option value="">
                      Select warehouse
                    </option>

                    {locations.map(
                      (
                        location
                      ) => (
                        <option
                          key={
                            location.id
                          }
                          value={
                            location.id
                          }
                        >
                          {
                            location.code
                          }{" "}
                          —{" "}
                          {
                            location.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="rounded-xl border border-[#f0a83a]/20 bg-[#f0a83a]/5 p-4">
                  <p className="text-sm font-medium text-[#f0a83a]">
                    Inventory warning
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Confirming this receipt will increase inventory quantities and create permanent stock transaction records.
                  </p>
                </div>

                {receiveError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {
                      receiveError
                    }
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-white/8 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReceiveModal(
                        false
                      );
                      setSelectedPurchase(
                        null
                      );
                    }}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      receivePurchase
                    }
                    disabled={
                      receiving
                    }
                    className="btn-red rounded-xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {receiving
                      ? "Receiving..."
                      : "Confirm Receipt"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}