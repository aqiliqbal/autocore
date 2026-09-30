"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import DashboardLayout from "../../components/layout/dashboard-layout";

type Category = {
  id: string;
  name: string;
};

export default function AddPartPage() {
  const router = useRouter();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [form, setForm] = useState({
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
    initialStock: "0",
    locationId: "",
  });

  /* ----------------------------------------
     LOAD CATEGORIES
  ---------------------------------------- */

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);

        const response =
          await fetch("/api/categories");

        if (!response.ok) {
          throw new Error(
            "Failed to load categories."
          );
        }

        const data =
          await response.json();

        setCategories(data);
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load categories."
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  /* ----------------------------------------
     HANDLE INPUT
  ---------------------------------------- */

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* ----------------------------------------
     HANDLE IMAGE
  ---------------------------------------- */

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG, WEBP and GIF images are allowed."
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";

      return;
    }

    setError("");

    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  }

  /* ----------------------------------------
     UPLOAD IMAGE
  ---------------------------------------- */

  async function uploadImage(
    file: File
  ) {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const response =
      await fetch(
        "/api/upload/part-image",
        {
          method: "POST",
          body: formData,
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Failed to upload part image."
      );
    }

    return data.imageUrl as string;
  }

  /* ----------------------------------------
     SUBMIT
  ---------------------------------------- */

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    /* ----------------------------------------
       REQUIRED FIELDS
    ---------------------------------------- */

    if (
      !form.partNumber.trim() ||
      !form.name.trim() ||
      !form.categoryId ||
      !form.costPrice ||
      !form.sellingPrice
    ) {
      setError(
        "Part number, part name, category, cost price and selling price are required."
      );

      return;
    }

    try {
      setSaving(true);

      /* ----------------------------------------
         UPLOAD IMAGE FIRST
      ---------------------------------------- */

      let imageUrl: string | null =
        null;

      if (imageFile) {
        imageUrl =
          await uploadImage(
            imageFile
          );
      }

      /* ----------------------------------------
         CREATE PART
      ---------------------------------------- */

      const response =
        await fetch(
          "/api/parts",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              partNumber:
                form.partNumber.trim(),

              oemNumber:
                form.oemNumber.trim() ||
                null,

              barcode:
                form.barcode.trim() ||
                null,

              name:
                form.name.trim(),

              description:
                form.description.trim() ||
                null,

              manufacturer:
                form.manufacturer.trim() ||
                null,

              categoryId:
                form.categoryId,

              costPrice:
                Number(
                  form.costPrice
                ),

              sellingPrice:
                Number(
                  form.sellingPrice
                ),

              minimumStock:
                Number(
                  form.minimumStock
                ),

              reorderQuantity:
                Number(
                  form.reorderQuantity
                ),

              unit:
                form.unit.trim() ||
                "piece",

              weightKg:
                form.weightKg
                  ? Number(
                      form.weightKg
                    )
                  : null,

              locationId:
                form.locationId ||
                null,

              initialStock:
                Number(
                  form.initialStock ||
                    0
                ),

              imageUrl:
                imageUrl,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create part."
        );
      }

      /* ----------------------------------------
         SUCCESS
      ---------------------------------------- */

      router.push(
        "/parts"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Create part error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create part."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1100px] p-6 lg:p-8">

        {/* HEADER */}

        <section className="mb-8">

          <div className="mb-3 flex items-center gap-2">

            <span className="h-1.5 w-1.5 rounded-full bg-[#e5253f] shadow-[0_0_10px_rgba(229,37,63,0.8)]" />

            <p className="font-technical text-xs uppercase tracking-[0.25em] text-[#e5253f]">
              AutoCore / Parts / Add
            </p>

          </div>

          <h1 className="font-display text-5xl tracking-wide text-white lg:text-6xl">
            ADD NEW PART
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Register a new automotive component in the AutoCore parts database.
          </p>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">

            <p className="text-sm text-red-400">
              {error}
            </p>

          </div>
        )}

        <form
          onSubmit={handleSubmit}
        >

          <div className="space-y-6">

            {/* BASIC INFORMATION */}

            <section className="rounded-2xl border border-white/8 bg-[#0e1117] p-6">

              <div className="mb-6">

                <h2 className="font-technical text-sm font-semibold uppercase tracking-[0.15em] text-white">
                  Basic Information
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Identification and general information about the part.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <Input
                  label="Part Number *"
                  name="partNumber"
                  value={
                    form.partNumber
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. BP-001"
                />

                <Input
                  label="OEM Number"
                  name="oemNumber"
                  value={
                    form.oemNumber
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. OEM-12345"
                />

                <Input
                  label="Barcode"
                  name="barcode"
                  value={
                    form.barcode
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional barcode"
                />

                <Input
                  label="Part Name *"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Front Brake Pad"
                />

                <Input
                  label="Manufacturer"
                  name="manufacturer"
                  value={
                    form.manufacturer
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Bosch"
                />

                {/* CATEGORY */}

                <div>

                  <label className="mb-2 block text-xs font-medium text-zinc-400">
                    Category *
                  </label>

                  <select
                    name="categoryId"
                    value={
                      form.categoryId
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      loadingCategories
                    }
                    className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white outline-none transition focus:border-[#e5253f]/50 disabled:opacity-50"
                  >

                    <option value="">
                      {loadingCategories
                        ? "Loading categories..."
                        : "Select category"}
                    </option>

                    {categories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              {/* DESCRIPTION */}

              <div className="mt-5">

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
                  rows={4}
                  placeholder="Describe the part..."
                  className="w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#e5253f]/50"
                />

              </div>

            </section>

            {/* IMAGE */}

            <section className="rounded-2xl border border-white/8 bg-[#0e1117] p-6">

              <div className="mb-6">

                <h2 className="font-technical text-sm font-semibold uppercase tracking-[0.15em] text-white">
                  Part Image
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Upload an image of the automotive part.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_220px]">

                <div>

                  <label className="mb-2 block text-xs font-medium text-zinc-400">
                    Part Image
                  </label>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={
                      handleImageChange
                    }
                    className="block w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 py-3 text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-[#e5253f]/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#ff334d] hover:file:bg-[#e5253f]/20"
                  />

                  <p className="mt-2 text-xs text-zinc-600">
                    JPG, PNG, WEBP or GIF · Maximum 5 MB
                  </p>

                </div>

                {/* PREVIEW */}

                <div className="flex min-h-[180px] items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-[#080a0e]">

                  {imagePreview ? (
                    <img
                      src={
                        imagePreview
                      }
                      alt="Part preview"
                      className="h-full max-h-[180px] w-full object-contain"
                    />
                  ) : (
                    <p className="text-xs text-zinc-700">
                      IMAGE PREVIEW
                    </p>
                  )}

                </div>

              </div>

            </section>

            {/* PRICING */}

            <section className="rounded-2xl border border-white/8 bg-[#0e1117] p-6">

              <div className="mb-6">

                <h2 className="font-technical text-sm font-semibold uppercase tracking-[0.15em] text-white">
                  Pricing
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Define purchasing and selling prices.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <Input
                  label="Cost Price *"
                  name="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.costPrice
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0.00"
                />

                <Input
                  label="Selling Price *"
                  name="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.sellingPrice
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0.00"
                />

                <Input
                  label="Unit"
                  name="unit"
                  value={
                    form.unit
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="piece"
                />

                <Input
                  label="Weight (kg)"
                  name="weightKg"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.weightKg
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional"
                />

              </div>

            </section>

            {/* INVENTORY */}

            <section className="rounded-2xl border border-white/8 bg-[#0e1117] p-6">

              <div className="mb-6">

                <h2 className="font-technical text-sm font-semibold uppercase tracking-[0.15em] text-white">
                  Inventory Settings
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Configure stock and automatic stock warning levels.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <Input
                  label="Initial Stock"
                  name="initialStock"
                  type="number"
                  min="0"
                  value={
                    form.initialStock
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0"
                />

                <Input
                  label="Minimum Stock"
                  name="minimumStock"
                  type="number"
                  min="0"
                  value={
                    form.minimumStock
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="5"
                />

                <Input
                  label="Reorder Quantity"
                  name="reorderQuantity"
                  type="number"
                  min="0"
                  value={
                    form.reorderQuantity
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="10"
                />

              </div>

              <div className="mt-5 rounded-xl border border-[#e5253f]/10 bg-[#e5253f]/5 p-4">

                <p className="text-xs leading-5 text-zinc-500">
                  Warehouse location selection can be added once warehouse locations are available through the API.
                </p>

              </div>

            </section>

            {/* ACTIONS */}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/parts"
                  )
                }
                disabled={saving}
                className="rounded-xl border border-white/8 bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-400 transition hover:border-white/15 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn-red rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating Part..."
                  : "Create Part"}
              </button>

            </div>

          </div>

        </form>

      </div>
    </DashboardLayout>
  );
}

/* ----------------------------------------
   INPUT COMPONENT
---------------------------------------- */

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}: {
  label: string;
  name: string;
  value: string;

  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;

  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#e5253f]/50"
      />

    </div>
  );
}