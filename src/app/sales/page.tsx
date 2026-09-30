"use client";

import DashboardLayout from "../components/layout/dashboard-layout";
import ModulePage from "../components/layout/module-page";
import { useEffect, useMemo, useState } from "react";

type ApiSale = {
  id: string;
  saleNumber: string;
  saleDate: string;
  status: string;
  paymentStatus: string;
  total: string | number;

  customer: {
    name: string;
  } | null;

  items: {
    quantity: number;
  }[];
};

type SaleRow = {
  "Invoice Number": string;
  Customer: string;
  Date: string;
  Items: string;
  Total: string;
  Status: string;
};

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

function formatPaymentStatus(status: string) {
  const names: Record<string, string> = {
    PENDING: "Pending",
    PARTIAL: "Partial",
    PAID: "Paid",
    REFUNDED: "Refunded",
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

export default function SalesPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  const [items, setItems] = useState<SaleItem[]>([]);

  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("PAID");

  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/sales");

      if (!response.ok) {
        throw new Error("Failed to fetch sales");
      }

      const data: ApiSale[] = await response.json();

      const formattedSales: SaleRow[] = data.map((sale) => {
        const itemQuantity = sale.items.reduce(
          (total, item) => total + item.quantity,
          0
        );

        return {
          "Invoice Number": sale.saleNumber,
          Customer: sale.customer?.name ?? "Walk-in Customer",
          Date: formatDate(sale.saleDate),
          Items: itemQuantity.toString(),
          Total: `$${Number(sale.total).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          Status: formatPaymentStatus(sale.paymentStatus),
        };
      });

      setSales(formattedSales);
    } catch (error) {
      console.error("Failed to load sales:", error);
      setError("Unable to load sales from database.");
    } finally {
      setLoading(false);
    }
  }

  async function openNewSale() {
    setShowModal(true);
    setModalError("");
    setModalLoading(true);

    try {
      const [customersResponse, locationsResponse, partsResponse] =
        await Promise.all([
          fetch("/api/customers"),
          fetch("/api/warehouse-locations"),
          fetch("/api/parts"),
        ]);

      if (
        !customersResponse.ok ||
        !locationsResponse.ok ||
        !partsResponse.ok
      ) {
        throw new Error("Failed to load sales data.");
      }

      const customersData: Customer[] = await customersResponse.json();

      const locationsData: WarehouseLocation[] =
        await locationsResponse.json();

      const partsData: Part[] = await partsResponse.json();

      setCustomers(customersData);
      setLocations(locationsData);
      setParts(partsData);

      if (!locationId && locationsData.length > 0) {
        setLocationId(locationsData[0].id);
      }
    } catch (error) {
      console.error("Failed to load new sale data:", error);

      setModalError(
        "Unable to load customers, warehouse locations or parts."
      );
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    if (submitting) return;

    setShowModal(false);
    setCustomerId("");
    setSelectedPartId("");
    setQuantity("1");
    setUnitPrice("");
    setItems([]);
    setDiscount("0");
    setTax("0");
    setPaymentStatus("PAID");
    setModalError("");
  }

  const selectedPart = parts.find(
    (part) => part.id === selectedPartId
  );

  const selectedInventory = selectedPart?.inventory.find(
    (inventory) => inventory.locationId === locationId
  );

  const availableStock = selectedInventory
    ? Math.max(
        0,
        selectedInventory.quantity -
          selectedInventory.reservedQuantity
      )
    : 0;

  function handlePartChange(partId: string) {
    setSelectedPartId(partId);

    const part = parts.find((item) => item.id === partId);

    if (part) {
      setUnitPrice(Number(part.sellingPrice).toString());
    } else {
      setUnitPrice("");
    }

    setQuantity("1");
    setModalError("");
  }

  function addItem() {
    setModalError("");

    if (!selectedPart) {
      setModalError("Please select a part.");
      return;
    }

    if (!locationId) {
      setModalError("Please select a warehouse first.");
      return;
    }

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(unitPrice);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setModalError("Quantity must be a positive whole number.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setModalError("Selling price must be greater than zero.");
      return;
    }

    if (availableStock <= 0) {
      setModalError("This part is out of stock in the selected warehouse.");
      return;
    }

    if (parsedQuantity > availableStock) {
      setModalError(
        `Only ${availableStock} unit(s) are available for this part.`
      );
      return;
    }

    const existingItem = items.find(
      (item) => item.partId === selectedPart.id
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + parsedQuantity;

      if (newQuantity > availableStock) {
        setModalError(
          `You already added ${existingItem.quantity} unit(s). Maximum available is ${availableStock}.`
        );
        return;
      }

      setItems(
        items.map((item) =>
          item.partId === selectedPart.id
            ? {
                ...item,
                quantity: newQuantity,
                unitPrice: parsedPrice,
              }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          partId: selectedPart.id,
          quantity: parsedQuantity,
          unitPrice: parsedPrice,
        },
      ]);
    }

    setSelectedPartId("");
    setQuantity("1");
    setUnitPrice("");
  }

  function removeItem(partId: string) {
    setItems(
      items.filter((item) => item.partId !== partId)
    );
  }

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.quantity * item.unitPrice,
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
    subtotal - discountAmount + taxAmount
  );

  const estimatedProfit = useMemo(() => {
    return items.reduce((profit, item) => {
      const part = parts.find(
        (databasePart) =>
          databasePart.id === item.partId
      );

      if (!part) {
        return profit;
      }

      const cost = Number(part.costPrice);

      return (
        profit +
        item.quantity *
          (item.unitPrice - cost)
      );
    }, 0);
  }, [items, parts]);

  async function createSale() {
    setModalError("");

    if (!locationId) {
      setModalError("Please select a warehouse.");
      return;
    }

    if (items.length === 0) {
      setModalError("Please add at least one part.");
      return;
    }

    if (discountAmount > subtotal) {
      setModalError(
        "Discount cannot be greater than the subtotal."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId || null,
          locationId,
          discount: discountAmount,
          tax: taxAmount,
          paymentStatus,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create sale."
        );
      }

      closeModal();

      await loadSales();
    } catch (error) {
      console.error("Failed to create sale:", error);

      setModalError(
        error instanceof Error
          ? error.message
          : "Failed to create sale."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date();

  const todaysSales = sales.reduce((total, sale) => {
    const saleDate = new Date(sale.Date);

    if (
      saleDate.getDate() === today.getDate() &&
      saleDate.getMonth() === today.getMonth() &&
      saleDate.getFullYear() === today.getFullYear()
    ) {
      return (
        total +
        Number(
          sale.Total
            .replace("$", "")
            .replace(/,/g, "")
        )
      );
    }

    return total;
  }, 0);

  const paidSales = sales.reduce((total, sale) => {
    if (sale.Status === "Paid") {
      return (
        total +
        Number(
          sale.Total
            .replace("$", "")
            .replace(/,/g, "")
        )
      );
    }

    return total;
  }, 0);

  const pendingSales = sales.reduce((total, sale) => {
    if (
      sale.Status === "Pending" ||
      sale.Status === "Partial"
    ) {
      return (
        total +
        Number(
          sale.Total
            .replace("$", "")
            .replace(/,/g, "")
        )
      );
    }

    return total;
  }, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

            <p className="text-sm text-zinc-400">
              Loading sales database...
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
        eyebrow="Sales"
        title="SALES & INVOICES"
        description="Manage customer sales, invoices, payments and automotive parts transactions."
        buttonText="New Sale"
        onButtonClick={openNewSale}
        searchPlaceholder="Search invoice, customer or payment status..."
        columns={[
          "Invoice Number",
          "Customer",
          "Date",
          "Items",
          "Total",
          "Status",
        ]}
        data={sales}
        stats={[
          {
            label: "Today's Sales",
            value: `$${todaysSales.toLocaleString()}`,
            description: "Current day",
          },
          {
            label: "Invoices",
            value: sales.length.toString(),
            description: "Recorded invoices",
          },
          {
            label: "Paid",
            value: `$${paidSales.toLocaleString()}`,
            description: "Collected",
          },
          {
            label: "Pending",
            value: `$${pendingSales.toLocaleString()}`,
            description: "Outstanding",
          },
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="my-4 max-h-[90vh] w-full max-w-5xl overflow-x-hidden overflow-y-auto rounded-2xl border border-white/10 bg-[#0e1117] shadow-2xl">
            
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0e1117] px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e5253f]">
                  Sales Transaction
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  NEW SALE
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg px-3 py-2 text-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                ×
              </button>
            </div>

            {modalLoading ? (
              <div className="flex min-h-[350px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

                  <p className="text-sm text-zinc-400">
                    Loading sales data...
                  </p>
                </div>
              </div>
            ) : (
              <div className="min-w-0 space-y-6 p-6">

                {modalError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {modalError}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Customer
                    </label>

                    <select
                      value={customerId}
                      onChange={(event) =>
                        setCustomerId(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#151922] px-4 py-3 text-sm text-white outline-none transition focus:border-[#e5253f]"
                    >
                      <option value="">
                        Walk-in Customer
                      </option>

                      {customers.map((customer) => (
                        <option
                          key={customer.id}
                          value={customer.id}
                        >
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Warehouse
                    </label>

                    <select
                      value={locationId}
                      onChange={(event) => {
                        setLocationId(event.target.value);
                        setSelectedPartId("");
                        setUnitPrice("");
                        setModalError("");
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#151922] px-4 py-3 text-sm text-white outline-none transition focus:border-[#e5253f]"
                    >
                      <option value="">
                        Select warehouse
                      </option>

                      {locations.map((location) => (
                        <option
                          key={location.id}
                          value={location.id}
                        >
                          {location.code} — {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0a0c10] p-5">

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-white">
                      Add Parts
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Select parts from the selected warehouse.
                    </p>
                  </div>

                  {/* FIXED RESPONSIVE GRID */}
                  <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,2fr)_120px_140px_100px]">

                    <select
                      value={selectedPartId}
                      onChange={(event) =>
                        handlePartChange(event.target.value)
                      }
                      className="w-full min-w-0 rounded-xl border border-white/10 bg-[#151922] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
                    >
                      <option value="">
                        Select part
                      </option>

                      {parts.map((part) => {
                        const inventory =
                          part.inventory.find(
                            (item) =>
                              item.locationId === locationId
                          );

                        const available =
                          Math.max(
                            0,
                            (inventory?.quantity ?? 0) -
                              (inventory?.reservedQuantity ?? 0)
                          );

                        return (
                          <option
                            key={part.id}
                            value={part.id}
                            disabled={available <= 0}
                          >
                            {part.partNumber} — {part.name} | Stock: {available}
                          </option>
                        );
                      })}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(event.target.value)
                      }
                      placeholder="Quantity"
                      className="w-full min-w-0 rounded-xl border border-white/10 bg-[#151922] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
                    />

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={unitPrice}
                      onChange={(event) =>
                        setUnitPrice(event.target.value)
                      }
                      placeholder="Selling price"
                      className="w-full min-w-0 rounded-xl border border-white/10 bg-[#151922] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
                    />

                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full rounded-xl bg-[#e5253f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d]"
                    >
                      Add
                    </button>
                  </div>

                  {selectedPart && (
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
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
                        <span className="text-white">
                          {availableStock}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-sm">
                        <thead className="bg-[#151922] text-xs uppercase tracking-wider text-zinc-500">
                          <tr>
                            <th className="px-4 py-3 text-left">
                              Part
                            </th>

                            <th className="px-4 py-3 text-right">
                              Qty
                            </th>

                            <th className="px-4 py-3 text-right">
                              Unit Price
                            </th>

                            <th className="px-4 py-3 text-right">
                              Line Total
                            </th>

                            <th className="px-4 py-3" />
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-white/5">
                          {items.map((item) => {
                            const part = parts.find(
                              (databasePart) =>
                                databasePart.id ===
                                item.partId
                            );

                            return (
                              <tr key={item.partId}>
                                <td className="px-4 py-4">
                                  <div className="font-medium text-white">
                                    {part?.name}
                                  </div>

                                  <div className="mt-1 text-xs text-zinc-500">
                                    {part?.partNumber}
                                  </div>
                                </td>

                                <td className="px-4 py-4 text-right text-zinc-300">
                                  {item.quantity}
                                </td>

                                <td className="px-4 py-4 text-right text-zinc-300">
                                  ${item.unitPrice.toFixed(2)}
                                </td>

                                <td className="px-4 py-4 text-right font-medium text-white">
                                  $
                                  {(
                                    item.quantity *
                                    item.unitPrice
                                  ).toFixed(2)}
                                </td>

                                <td className="px-4 py-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItem(
                                        item.partId
                                      )
                                    }
                                    className="text-xs font-medium text-red-400 transition hover:text-red-300"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">

                  <div className="rounded-2xl border border-white/10 bg-[#0a0c10] p-5">

                    <h3 className="mb-4 text-sm font-semibold text-white">
                      Payment
                    </h3>

                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Payment Status
                    </label>

                    <select
                      value={paymentStatus}
                      onChange={(event) =>
                        setPaymentStatus(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#151922] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
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

                    <div className="mt-5 grid grid-cols-2 gap-3">

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
                          className="w-full rounded-xl border border-white/10 bg-[#151922] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
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
                            setTax(event.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#151922] px-4 py-3 text-sm text-white outline-none focus:border-[#e5253f]"
                        />
                      </div>

                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0a0c10] p-5">

                    <h3 className="mb-4 text-sm font-semibold text-white">
                      Sale Summary
                    </h3>

                    <div className="space-y-3 text-sm">

                      <div className="flex justify-between text-zinc-400">
                        <span>Subtotal</span>

                        <span>
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-zinc-400">
                        <span>Discount</span>

                        <span>
                          -${discountAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-zinc-400">
                        <span>Tax</span>

                        <span>
                          +${taxAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="border-t border-white/10 pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-white">
                            Total
                          </span>

                          <span className="text-xl font-bold text-[#ff334d]">
                            ${total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">
                            Estimated Profit
                          </span>

                          <span className="font-semibold text-emerald-400">
                            ${estimatedProfit.toFixed(2)}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                <div className="flex justify-end gap-3 border-t border-white/10 pt-5">

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={createSale}
                    disabled={
                      submitting ||
                      items.length === 0
                    }
                    className="rounded-xl bg-[#e5253f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting
                      ? "Processing..."
                      : "Complete Sale"}
                  </button>

                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}