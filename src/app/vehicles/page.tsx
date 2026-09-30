"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/dashboard-layout";
import ModulePage from "../components/layout/module-page";

type ApiVehicle = {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  bodyType: string | null;
  fuelType: string | null;
  transmission: string | null;
  registrationNumber: string | null;
  vin: string | null;
};

type ModuleVehicle = {
  Make: string;
  Model: string;
  Variant: string;
  Year: string;
  "Body Type": string;
  Fuel: string;
  Transmission: string;
  Registration: string;
};

export default function VehiclesPage() {
  const [data, setData] = useState<ModuleVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    make: "",
    model: "",
    variant: "",
    yearFrom: "",
    yearTo: "",
    bodyType: "",
    fuelType: "",
    transmission: "",
    registrationNumber: "",
    vin: "",
    notes: "",
  });

  async function loadVehicles() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/vehicles");

      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }

      const vehicles: ApiVehicle[] = await response.json();

      const formattedVehicles: ModuleVehicle[] =
        vehicles.map((vehicle) => ({
          Make: vehicle.make,
          Model: vehicle.model,
          Variant: vehicle.variant || "—",

          Year:
            vehicle.yearFrom || vehicle.yearTo
              ? `${vehicle.yearFrom || "—"} - ${
                  vehicle.yearTo || "—"
                }`
              : "—",

          "Body Type": vehicle.bodyType || "—",

          Fuel: vehicle.fuelType
            ? vehicle.fuelType.replace("_", " ")
            : "—",

          Transmission: vehicle.transmission
            ? vehicle.transmission.replace("_", " ")
            : "—",

          Registration:
            vehicle.registrationNumber || "—",
        }));

      setData(formattedVehicles);
    } catch (error) {
      console.error(error);
      setError("Unable to load vehicles from database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  function updateForm(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({
      make: "",
      model: "",
      variant: "",
      yearFrom: "",
      yearTo: "",
      bodyType: "",
      fuelType: "",
      transmission: "",
      registrationNumber: "",
      vin: "",
      notes: "",
    });

    setFormError("");
  }

  async function handleCreateVehicle() {
    setFormError("");

    if (!form.make.trim() || !form.model.trim()) {
      setFormError(
        "Make and Model are required."
      );
      return;
    }

    if (
      form.yearFrom &&
      form.yearTo &&
      Number(form.yearFrom) > Number(form.yearTo)
    ) {
      setFormError(
        "Year From cannot be greater than Year To."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          make: form.make.trim(),
          model: form.model.trim(),
          variant: form.variant.trim(),
          yearFrom: form.yearFrom,
          yearTo: form.yearTo,
          bodyType: form.bodyType,
          fuelType: form.fuelType,
          transmission: form.transmission,
          registrationNumber:
            form.registrationNumber.trim(),
          vin: form.vin.trim(),
          notes: form.notes.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to create vehicle."
        );
      }

      setShowModal(false);
      resetForm();

      await loadVehicles();
    } catch (error) {
      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create vehicle."
      );
    } finally {
      setSaving(false);
    }
  }

  const totalVehicles = data.length;

  const makes = new Set(
    data.map((vehicle) => vehicle.Make)
  ).size;

  const models = new Set(
    data.map(
      (vehicle) =>
        `${vehicle.Make} ${vehicle.Model}`
    )
  ).size;

  const registeredVehicles = data.filter(
    (vehicle) =>
      vehicle.Registration !== "—"
  ).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

            <p className="text-sm text-zinc-400">
              Loading vehicle database...
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
              onClick={loadVehicles}
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
        eyebrow="Vehicles"
        title="VEHICLE DATABASE"
        description="Manage vehicle makes, models, variants, specifications, registrations and vehicle compatibility."
        buttonText="Add Vehicle"
        onButtonClick={() => {
          setFormError("");
          setShowModal(true);
        }}
        searchPlaceholder="Search make, model, variant, registration or fuel type..."
        columns={[
          "Make",
          "Model",
          "Variant",
          "Year",
          "Body Type",
          "Fuel",
          "Transmission",
          "Registration",
        ]}
        data={data}
        stats={[
          {
            label: "Total Vehicles",
            value: totalVehicles.toString(),
            description: "Registered vehicles",
          },
          {
            label: "Makes",
            value: makes.toString(),
            description: "Vehicle manufacturers",
          },
          {
            label: "Models",
            value: models.toString(),
            description: "Unique vehicle models",
          },
          {
            label: "Registered",
            value: registeredVehicles.toString(),
            description: "With registration number",
          },
        ]}
      />

      {/* ADD VEHICLE MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0e1117] shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
              <div>
                <p className="font-technical text-[10px] uppercase tracking-[0.2em] text-[#e5253f]">
                  AutoCore / Vehicles
                </p>

                <h2 className="mt-1 font-display text-3xl tracking-wide text-white">
                  ADD NEW VEHICLE
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
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
                <FormInput
                  label="Make *"
                  value={form.make}
                  onChange={(value) =>
                    updateForm("make", value)
                  }
                  placeholder="e.g. Toyota"
                />

                <FormInput
                  label="Model *"
                  value={form.model}
                  onChange={(value) =>
                    updateForm("model", value)
                  }
                  placeholder="e.g. Corolla"
                />

                <FormInput
                  label="Variant"
                  value={form.variant}
                  onChange={(value) =>
                    updateForm("variant", value)
                  }
                  placeholder="e.g. Altis Grande"
                />

                <FormInput
                  label="Body Type"
                  value={form.bodyType}
                  onChange={(value) =>
                    updateForm("bodyType", value)
                  }
                  placeholder="e.g. Sedan"
                />

                <FormInput
                  label="Year From"
                  value={form.yearFrom}
                  onChange={(value) =>
                    updateForm("yearFrom", value)
                  }
                  placeholder="e.g. 2018"
                  type="number"
                />

                <FormInput
                  label="Year To"
                  value={form.yearTo}
                  onChange={(value) =>
                    updateForm("yearTo", value)
                  }
                  placeholder="e.g. 2022"
                  type="number"
                />

                {/* FUEL */}

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                    Fuel Type
                  </label>

                  <select
                    value={form.fuelType}
                    onChange={(event) =>
                      updateForm(
                        "fuelType",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-3 text-sm text-white outline-none focus:border-[#e5253f]/50"
                  >
                    <option value="">
                      Select fuel type
                    </option>

                    <option value="PETROL">
                      Petrol
                    </option>

                    <option value="DIESEL">
                      Diesel
                    </option>

                    <option value="HYBRID">
                      Hybrid
                    </option>

                    <option value="ELECTRIC">
                      Electric
                    </option>

                    <option value="CNG">
                      CNG
                    </option>

                    <option value="LPG">
                      LPG
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>

                {/* TRANSMISSION */}

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                    Transmission
                  </label>

                  <select
                    value={form.transmission}
                    onChange={(event) =>
                      updateForm(
                        "transmission",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-3 text-sm text-white outline-none focus:border-[#e5253f]/50"
                  >
                    <option value="">
                      Select transmission
                    </option>

                    <option value="MANUAL">
                      Manual
                    </option>

                    <option value="AUTOMATIC">
                      Automatic
                    </option>

                    <option value="DCT">
                      DCT
                    </option>

                    <option value="CVT">
                      CVT
                    </option>

                    <option value="AMT">
                      AMT
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>

                <FormInput
                  label="Registration Number"
                  value={form.registrationNumber}
                  onChange={(value) =>
                    updateForm(
                      "registrationNumber",
                      value
                    )
                  }
                  placeholder="e.g. ABC-123"
                />

                <FormInput
                  label="VIN"
                  value={form.vin}
                  onChange={(value) =>
                    updateForm("vin", value)
                  }
                  placeholder="17-character VIN"
                />

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm(
                        "notes",
                        event.target.value
                      )
                    }
                    placeholder="Additional vehicle information..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/8 bg-[#080a0e] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#e5253f]/50"
                  />
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-white/8 px-6 py-5">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="rounded-xl border border-white/8 px-5 py-2.5 text-sm text-zinc-400 transition hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleCreateVehicle}
                className="btn-red rounded-xl px-6 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Create Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function FormInput({
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
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#e5253f]/50"
      />
    </div>
  );
}