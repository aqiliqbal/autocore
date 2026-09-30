"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/dashboard-layout";
import ModulePage from "../components/layout/module-page";

type ApiEngine = {
  id: string;
  engineCode: string;
  manufacturer: string;
  name: string;
  engineFamily: string | null;
  displacement: number | null;
  cylinders: number | null;
  fuelType: string | null;
  aspiration: string | null;
  horsepower: number | null;
  torqueNm: number | null;
};

type ModuleEngine = {
  "Engine Code": string;
  Manufacturer: string;
  Name: string;
  Family: string;
  Displacement: string;
  Cylinders: string;
  Fuel: string;
  Horsepower: string;
};

export default function EnginesPage() {
  const [data, setData] = useState<ModuleEngine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    engineCode: "",
    manufacturer: "",
    name: "",
    engineFamily: "",
    displacement: "",
    cylinders: "",
    fuelType: "",
    aspiration: "",
    horsepower: "",
    torqueNm: "",
    imageUrl: "",
    notes: "",
  });

  async function loadEngines() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/engines");

      if (!response.ok) {
        throw new Error("Failed to fetch engines");
      }

      const engines: ApiEngine[] = await response.json();

      const formattedEngines: ModuleEngine[] = engines.map(
        (engine) => ({
          "Engine Code": engine.engineCode,
          Manufacturer: engine.manufacturer,
          Name: engine.name,
          Family: engine.engineFamily || "—",

          Displacement:
            engine.displacement !== null
              ? `${engine.displacement} L`
              : "—",

          Cylinders:
            engine.cylinders !== null
              ? engine.cylinders.toString()
              : "—",

          Fuel: engine.fuelType
            ? engine.fuelType.replace("_", " ")
            : "—",

          Horsepower:
            engine.horsepower !== null
              ? `${engine.horsepower} HP`
              : "—",
        })
      );

      setData(formattedEngines);
    } catch (error) {
      console.error(error);
      setError("Unable to load engines from database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEngines();
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
      engineCode: "",
      manufacturer: "",
      name: "",
      engineFamily: "",
      displacement: "",
      cylinders: "",
      fuelType: "",
      aspiration: "",
      horsepower: "",
      torqueNm: "",
      imageUrl: "",
      notes: "",
    });

    setFormError("");
  }

  async function handleCreateEngine() {
    setFormError("");

    if (!form.engineCode.trim()) {
      setFormError("Engine Code is required.");
      return;
    }

    if (!form.manufacturer.trim()) {
      setFormError("Manufacturer is required.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Engine Name is required.");
      return;
    }

    if (
      form.displacement &&
      Number(form.displacement) <= 0
    ) {
      setFormError(
        "Displacement must be greater than zero."
      );
      return;
    }

    if (
      form.cylinders &&
      Number(form.cylinders) <= 0
    ) {
      setFormError(
        "Cylinders must be greater than zero."
      );
      return;
    }

    if (
      form.horsepower &&
      Number(form.horsepower) < 0
    ) {
      setFormError(
        "Horsepower cannot be negative."
      );
      return;
    }

    if (
      form.torqueNm &&
      Number(form.torqueNm) < 0
    ) {
      setFormError(
        "Torque cannot be negative."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/engines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          engineCode: form.engineCode.trim(),
          manufacturer: form.manufacturer.trim(),
          name: form.name.trim(),
          engineFamily: form.engineFamily.trim(),

          displacement: form.displacement,
          cylinders: form.cylinders,

          fuelType: form.fuelType,

          aspiration: form.aspiration.trim(),

          horsepower: form.horsepower,
          torqueNm: form.torqueNm,

          imageUrl: form.imageUrl.trim(),
          notes: form.notes.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to create engine."
        );
      }

      setShowModal(false);
      resetForm();

      await loadEngines();
    } catch (error) {
      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create engine."
      );
    } finally {
      setSaving(false);
    }
  }

  const totalEngines = data.length;

  const manufacturers = new Set(
    data.map(
      (engine) => engine.Manufacturer
    )
  ).size;

  const families = new Set(
    data
      .map((engine) => engine.Family)
      .filter((family) => family !== "—")
  ).size;

  const petrolEngines = data.filter(
    (engine) =>
      engine.Fuel.toLowerCase() === "petrol"
  ).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e5253f]" />

            <p className="text-sm text-zinc-400">
              Loading engine database...
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
              onClick={loadEngines}
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
        eyebrow="Engines"
        title="ENGINE DATABASE"
        description="Manage engine codes, manufacturers, specifications, performance data and engine families."
        buttonText="Add Engine"
        onButtonClick={() => {
          setFormError("");
          setShowModal(true);
        }}
        searchPlaceholder="Search engine code, manufacturer, name, family or fuel..."
        columns={[
          "Engine Code",
          "Manufacturer",
          "Name",
          "Family",
          "Displacement",
          "Cylinders",
          "Fuel",
          "Horsepower",
        ]}
        data={data}
        stats={[
          {
            label: "Total Engines",
            value: totalEngines.toString(),
            description: "Registered engines",
          },
          {
            label: "Manufacturers",
            value: manufacturers.toString(),
            description: "Engine manufacturers",
          },
          {
            label: "Engine Families",
            value: families.toString(),
            description: "Unique families",
          },
          {
            label: "Petrol Engines",
            value: petrolEngines.toString(),
            description: "Petrol power units",
          },
        ]}
      />

      {/* ADD ENGINE MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0e1117] shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
              <div>
                <p className="font-technical text-[10px] uppercase tracking-[0.2em] text-[#e5253f]">
                  AutoCore / Engines
                </p>

                <h2 className="mt-1 font-display text-3xl tracking-wide text-white">
                  ADD NEW ENGINE
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
                  label="Engine Code *"
                  value={form.engineCode}
                  onChange={(value) =>
                    updateForm(
                      "engineCode",
                      value
                    )
                  }
                  placeholder="e.g. 1NZ-FE"
                />

                <FormInput
                  label="Manufacturer *"
                  value={form.manufacturer}
                  onChange={(value) =>
                    updateForm(
                      "manufacturer",
                      value
                    )
                  }
                  placeholder="e.g. Toyota"
                />

                <FormInput
                  label="Engine Name *"
                  value={form.name}
                  onChange={(value) =>
                    updateForm("name", value)
                  }
                  placeholder="e.g. 1NZ-FE 1.5L"
                />

                <FormInput
                  label="Engine Family"
                  value={form.engineFamily}
                  onChange={(value) =>
                    updateForm(
                      "engineFamily",
                      value
                    )
                  }
                  placeholder="e.g. NZ Series"
                />

                <FormInput
                  label="Displacement (L)"
                  value={form.displacement}
                  onChange={(value) =>
                    updateForm(
                      "displacement",
                      value
                    )
                  }
                  placeholder="e.g. 1.5"
                  type="number"
                />

                <FormInput
                  label="Cylinders"
                  value={form.cylinders}
                  onChange={(value) =>
                    updateForm(
                      "cylinders",
                      value
                    )
                  }
                  placeholder="e.g. 4"
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

                <FormInput
                  label="Aspiration"
                  value={form.aspiration}
                  onChange={(value) =>
                    updateForm(
                      "aspiration",
                      value
                    )
                  }
                  placeholder="e.g. Naturally Aspirated / Turbo"
                />

                <FormInput
                  label="Horsepower"
                  value={form.horsepower}
                  onChange={(value) =>
                    updateForm(
                      "horsepower",
                      value
                    )
                  }
                  placeholder="e.g. 108"
                  type="number"
                />

                <FormInput
                  label="Torque (Nm)"
                  value={form.torqueNm}
                  onChange={(value) =>
                    updateForm(
                      "torqueNm",
                      value
                    )
                  }
                  placeholder="e.g. 142"
                  type="number"
                />

                <FormInput
                  label="Image URL"
                  value={form.imageUrl}
                  onChange={(value) =>
                    updateForm(
                      "imageUrl",
                      value
                    )
                  }
                  placeholder="https://..."
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
                    placeholder="Additional engine information..."
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
                onClick={handleCreateEngine}
                className="btn-red rounded-xl px-6 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Create Engine"}
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