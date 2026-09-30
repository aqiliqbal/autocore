"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/dashboard-layout";
import ModulePage from "../components/layout/module-page";

type ApiPart = {
  id: string;
  partNumber: string;
  oemNumber: string | null;
  name: string;
  category: {
    name: string;
  };
  sellingPrice: string | number;
  imageUrl: string | null;
  inventory: {
    quantity: number;
    reservedQuantity: number;
  }[];
  vehicleCompatibility: {
    vehicle: {
      make: string;
      model: string;
    };
  }[];
};

type ModulePart = {
  "Part Number": string;
  "Part Name": string;
  Category: string;
  Vehicle: string;
  Stock: string;
  Price: string;
};

type Category = {
  id: string;
  name: string;
};

type WarehouseLocation = {
  id: string;
  code: string;
  name: string;
};

type FormData = {
  partNumber: string;
  oemNumber: string;
  barcode: string;
  name: string;
  description: string;
  manufacturer: string;
  categoryId: string;
  costPrice: string;
  sellingPrice: string;
  minimumStock: string;
  reorderQuantity: string;
  unit: string;
  weightKg: string;
  locationId: string;
  initialStock: string;
  imageUrl: string;
};

const initialForm: FormData = {
  partNumber: "",
  oemNumber: "",
  barcode: "",
  name: "",
  description: "",
  manufacturer: "",
  categoryId: "",
  costPrice: "",
  sellingPrice: "",
  minimumStock: "5",
  reorderQuantity: "10",
  unit: "piece",
  weightKg: "",
  locationId: "",
  initialStock: "0",
  imageUrl: "",
};

export default function PartsPage() {
  const [data, setData] = useState<ModulePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  /*
   * ---------------------------------------------------------
   * IMAGE HANDLING
   * ---------------------------------------------------------
   */

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFormError("");

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    /*
     * Revoke previous preview URL to avoid memory leaks.
     */
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);
  }

  function removeSelectedImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview("");
  }

  async function uploadPartImage(): Promise<string | null> {
    if (!imageFile) {
      return null;
    }

    try {
      setUploadingImage(true);

      const supabase = createClient();

      const extension =
        imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${extension}`;

      const filePath = `parts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("part-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("part-images")
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error("Could not generate image URL.");
      }

      return data.publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);

      throw new Error(
        "Failed to upload part image. Please check your Supabase Storage settings."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOAD PARTS
   * ---------------------------------------------------------
   */

  async function loadParts() {
    try {
      setLoading(true);

      const response = await fetch("/api/parts");

      if (!response.ok) {
        throw new Error("Failed to fetch parts");
      }

      const parts: ApiPart[] = await response.json();

      const formattedParts: ModulePart[] = parts.map((part) => {
        const totalStock = part.inventory.reduce(
          (total, inventory) =>
            total +
            inventory.quantity -
            inventory.reservedQuantity,
          0
        );

        const vehicles = part.vehicleCompatibility
          .map(
            (compatibility) =>
              `${compatibility.vehicle.make} ${compatibility.vehicle.model}`
          )
          .join(", ");

        return {
          "Part Number": part.partNumber,
          "Part Name": part.name,
          Category: part.category.name,
          Vehicle: vehicles || "No mapping",
          Stock: totalStock.toString(),
          Price: `Rs. ${Number(
            part.sellingPrice
          ).toLocaleString()}`,
        };
      });

      setData(formattedParts);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Unable to load parts from database.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOAD FORM OPTIONS
   * ---------------------------------------------------------
   */

  async function loadFormOptions() {
    try {
      const [
        categoriesResponse,
        locationsResponse,
      ] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/warehouse-locations"),
      ]);

      if (!categoriesResponse.ok) {
        throw new Error("Failed to load categories");
      }

      if (!locationsResponse.ok) {
        throw new Error(
          "Failed to load warehouse locations"
        );
      }

      const categoriesData =
        await categoriesResponse.json();

      const locationsData =
        await locationsResponse.json();

      setCategories(categoriesData);
      setLocations(locationsData);
    } catch (error) {
      console.error(
        "Failed to load form options:",
        error
      );

      setFormError(
        "Unable to load categories or warehouse locations."
      );
    }
  }

  useEffect(() => {
    loadParts();
    loadFormOptions();

    /*
     * Cleanup image preview when page unmounts.
     */
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * FORM
   * ---------------------------------------------------------
   */

  function updateForm(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAddModal() {
    setForm(initialForm);

    removeSelectedImage();

    setFormError("");
    setModalOpen(true);
  }

  function closeAddModal() {
    if (saving) {
      return;
    }

    removeSelectedImage();

    setForm(initialForm);
    setModalOpen(false);
    setFormError("");
  }

  /*
   * ---------------------------------------------------------
   * SUBMIT
   * ---------------------------------------------------------
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");

    if (!form.partNumber.trim()) {
      setFormError("Part number is required.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Part name is required.");
      return;
    }

    if (!form.categoryId) {
      setFormError("Please select a category.");
      return;
    }

    if (
      form.costPrice === "" ||
      Number(form.costPrice) < 0
    ) {
      setFormError("Enter a valid cost price.");
      return;
    }

    if (
      form.sellingPrice === "" ||
      Number(form.sellingPrice) < 0
    ) {
      setFormError("Enter a valid selling price.");
      return;
    }

    if (
      Number(form.initialStock) > 0 &&
      !form.locationId
    ) {
      setFormError(
        "Please select a warehouse location when adding initial stock."
      );
      return;
    }

    try {
      setSaving(true);

      /*
       * Upload image FIRST.
       */
      let imageUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadPartImage();
      }

      /*
       * Create database record with image URL.
       */
      const response = await fetch("/api/parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partNumber: form.partNumber.trim(),

          oemNumber:
            form.oemNumber.trim() || null,

          barcode:
            form.barcode.trim() || null,

          name: form.name.trim(),

          description:
            form.description.trim() || null,

          manufacturer:
            form.manufacturer.trim() || null,

          categoryId: form.categoryId,

          costPrice: Number(form.costPrice),

          sellingPrice:
            Number(form.sellingPrice),

          minimumStock:
            Number(form.minimumStock),

          reorderQuantity:
            Number(form.reorderQuantity),

          unit:
            form.unit.trim() || "piece",

          weightKg:
            form.weightKg === ""
              ? null
              : Number(form.weightKg),

          locationId:
            form.locationId || null,

          initialStock:
            Number(form.initialStock || 0),

          imageUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to create part."
        );
      }

      /*
       * Reset everything after successful creation.
       */
      removeSelectedImage();

      setForm(initialForm);

      setModalOpen(false);

      await loadParts();
    } catch (error) {
      console.error(
        "Failed to create part:",
        error
      );

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create part."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * STATISTICS
   * ---------------------------------------------------------
   */

  const totalStock = data.reduce(
    (total, part) =>
      total + Number(part.Stock),
    0
  );

  const lowStock = data.filter(
    (part) => Number(part.Stock) <= 5
  ).length;

  const categoriesCount = new Set(
    data.map((part) => part.Category)
  ).size;

  const compatibleModels = new Set(
    data
      .flatMap((part) =>
        part.Vehicle.split(", ")
      )
      .filter(
        (vehicle) =>
          vehicle !== "No mapping"
      )
  ).size;

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

            <p className="text-sm text-zinc-400">
              Loading parts database...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <DashboardLayout>
      <ModulePage
        eyebrow="Parts"
        title="PARTS DATABASE"
        description="Manage automotive components, OEM numbers, categories, prices and vehicle compatibility."
        buttonText="Add Part"
        onButtonClick={openAddModal}
        searchPlaceholder="Search part name, OEM number, category or vehicle..."
        columns={[
          "Part Number",
          "Part Name",
          "Category",
          "Vehicle",
          "Stock",
          "Price",
        ]}
        data={data}
        stats={[
          {
            label: "Total Parts",
            value: data.length.toString(),
            description: `${totalStock} total units`,
          },
          {
            label: "Categories",
            value:
              categoriesCount.toString(),
            description: "Active categories",
          },
          {
            label: "Compatible Models",
            value:
              compatibleModels.toString(),
            description: "Vehicle mappings",
          },
          {
            label: "Low Stock",
            value:
              lowStock.toString(),
            description: "Needs attention",
          },
        ]}
      />

      {/* =====================================================
          ADD PART MODAL
      ===================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0f14] shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#0c0f14] px-6 py-5">
              <div>
                <p className="font-technical text-[10px] uppercase tracking-[0.2em] text-[#e5253f]">
                  AutoCore / Parts
                </p>

                <h2 className="font-display mt-1 text-3xl tracking-wide text-white">
                  ADD NEW PART
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 text-zinc-500 transition hover:border-white/15 hover:text-white disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              {/* ERROR */}

              {formError && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {formError}
                </div>
              )}

              {/* =================================================
                  BASIC INFORMATION
              ================================================= */}

              <div className="mb-6">
                <p className="mb-4 font-technical text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Part Information
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                  <FormInput
                    label="Part Number"
                    required
                    value={
                      form.partNumber
                    }
                    onChange={(value) =>
                      updateForm(
                        "partNumber",
                        value
                      )
                    }
                    placeholder="e.g. BRK-HON-001"
                  />

                  <FormInput
                    label="Part Name"
                    required
                    value={form.name}
                    onChange={(value) =>
                      updateForm(
                        "name",
                        value
                      )
                    }
                    placeholder="e.g. Honda Civic Brake Pad"
                  />

                  <FormInput
                    label="OEM Number"
                    value={
                      form.oemNumber
                    }
                    onChange={(value) =>
                      updateForm(
                        "oemNumber",
                        value
                      )
                    }
                    placeholder="Optional"
                  />

                  <FormInput
                    label="Barcode"
                    value={
                      form.barcode
                    }
                    onChange={(value) =>
                      updateForm(
                        "barcode",
                        value
                      )
                    }
                    placeholder="Optional"
                  />

                  <FormInput
                    label="Manufacturer"
                    value={
                      form.manufacturer
                    }
                    onChange={(value) =>
                      updateForm(
                        "manufacturer",
                        value
                      )
                    }
                    placeholder="e.g. Bosch"
                  />

                  <FormSelect
                    label="Category"
                    required
                    value={
                      form.categoryId
                    }
                    onChange={(value) =>
                      updateForm(
                        "categoryId",
                        value
                      )
                    }
                    options={categories.map(
                      (category) => ({
                        value:
                          category.id,
                        label:
                          category.name,
                      })
                    )}
                    placeholder="Select category"
                  />
                </div>
              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div className="mb-6">
                <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Optional part description..."
                  className="w-full resize-none rounded-xl border border-white/8 bg-[#080a0e] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#e5253f]/50"
                />
              </div>

              {/* =================================================
                  PART IMAGE
              ================================================= */}

              <div className="mb-6">
                <p className="mb-4 font-technical text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Part Image
                </p>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr]">

                  {/* IMAGE PREVIEW */}

                  <div className="relative flex h-[180px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#080a0e]">

                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Part preview"
                          className="h-full w-full object-contain p-3"
                        />

                        <button
                          type="button"
                          onClick={
                            removeSelectedImage
                          }
                          disabled={saving}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-sm text-white transition hover:bg-[#e5253f] disabled:opacity-50"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-2xl">
                          📷
                        </div>

                        <p className="text-xs text-zinc-600">
                          No image selected
                        </p>
                      </div>
                    )}

                  </div>

                  {/* UPLOAD AREA */}

                  <div className="flex flex-col justify-center">

                    <label
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#080a0e] px-6 py-8 text-center transition ${
                        saving
                          ? "pointer-events-none opacity-50"
                          : "hover:border-[#e5253f]/50 hover:bg-[#e5253f]/5"
                      }`}
                    >

                      <div className="mb-3 text-3xl">
                        ↑
                      </div>

                      <p className="text-sm font-medium text-white">
                        Upload Part Image
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        PNG, JPG or WEBP · Maximum 5 MB
                      </p>

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={
                          handleImageChange
                        }
                        disabled={saving}
                        className="hidden"
                      />

                    </label>

                    {imageFile && (
                      <p className="mt-3 truncate text-xs text-zinc-500">
                        Selected:{" "}
                        {imageFile.name}
                      </p>
                    )}

                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                      Upload an image of the actual automotive part.
                      Customers will see this image in the AutoCore store.
                    </p>

                  </div>
                </div>
              </div>

              {/* =================================================
                  PRICING
              ================================================= */}

              <div className="mb-6">
                <p className="mb-4 font-technical text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Pricing & Stock Rules
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <FormInput
                    label="Cost Price"
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.costPrice
                    }
                    onChange={(value) =>
                      updateForm(
                        "costPrice",
                        value
                      )
                    }
                    placeholder="0.00"
                  />

                  <FormInput
                    label="Selling Price"
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.sellingPrice
                    }
                    onChange={(value) =>
                      updateForm(
                        "sellingPrice",
                        value
                      )
                    }
                    placeholder="0.00"
                  />

                  <FormInput
                    label="Minimum Stock"
                    type="number"
                    min="0"
                    value={
                      form.minimumStock
                    }
                    onChange={(value) =>
                      updateForm(
                        "minimumStock",
                        value
                      )
                    }
                    placeholder="5"
                  />

                  <FormInput
                    label="Reorder Quantity"
                    type="number"
                    min="0"
                    value={
                      form.reorderQuantity
                    }
                    onChange={(value) =>
                      updateForm(
                        "reorderQuantity",
                        value
                      )
                    }
                    placeholder="10"
                  />

                </div>
              </div>

              {/* =================================================
                  INVENTORY
              ================================================= */}

              <div className="mb-6">
                <p className="mb-4 font-technical text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Initial Inventory
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  <FormSelect
                    label="Warehouse Location"
                    value={
                      form.locationId
                    }
                    onChange={(value) =>
                      updateForm(
                        "locationId",
                        value
                      )
                    }
                    options={locations.map(
                      (location) => ({
                        value:
                          location.id,
                        label: `${location.code} — ${location.name}`,
                      })
                    )}
                    placeholder="Select location"
                  />

                  <FormInput
                    label="Initial Stock"
                    type="number"
                    min="0"
                    value={
                      form.initialStock
                    }
                    onChange={(value) =>
                      updateForm(
                        "initialStock",
                        value
                      )
                    }
                    placeholder="0"
                  />

                  <FormInput
                    label="Unit"
                    value={form.unit}
                    onChange={(value) =>
                      updateForm(
                        "unit",
                        value
                      )
                    }
                    placeholder="piece"
                  />

                </div>
              </div>

              {/* =================================================
                  OTHER
              ================================================= */}

              <div className="mb-8">
                <p className="mb-4 font-technical text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Additional Information
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                  <FormInput
                    label="Weight (kg)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.weightKg
                    }
                    onChange={(value) =>
                      updateForm(
                        "weightKg",
                        value
                      )
                    }
                    placeholder="Optional"
                  />

                </div>
              </div>

              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="flex justify-end gap-3 border-t border-white/8 pt-5">

                <button
                  type="button"
                  onClick={
                    closeAddModal
                  }
                  disabled={
                    saving ||
                    uploadingImage
                  }
                  className="rounded-xl border border-white/8 bg-[#101319] px-5 py-3 text-sm text-zinc-400 transition hover:border-white/15 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    uploadingImage
                  }
                  className="btn-red rounded-xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingImage
                    ? "Uploading Image..."
                    : saving
                    ? "Saving Part..."
                    : "Save Part"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/*
 * =============================================================
 * FORM INPUT
 * =============================================================
 */

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
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
        min={min}
        step={step}
        required={required}
        className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#e5253f]/50"
      />
    </div>
  );
}

/*
 * =============================================================
 * FORM SELECT
 * =============================================================
 */

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
        {label}

        {required && (
          <span className="ml-1 text-[#e5253f]">
            *
          </span>
        )}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white outline-none focus:border-[#e5253f]/50"
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}