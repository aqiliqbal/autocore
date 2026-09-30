"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/dashboard-layout";

type Category = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  parentCategoryId: string | null;
  parent: {
    id: string;
    name: string;
  } | null;
  _count?: {
    parts: number;
    children: number;
  };
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/categories");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load categories.");
      }

      setCategories(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleAddCategory(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create category."
        );
      }

      setCategories((current) => [data, ...current]);

      setName("");
      setDescription("");

      setSuccess("Category created successfully.");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategory(
    category: Category
  ) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !category.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update category."
        );
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? data : item
        )
      );

      setSuccess(
        `${category.name} ${
          data.isActive ? "activated" : "deactivated"
        }.`
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update category."
      );
    }
  }

  async function deleteCategory(category: Category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/categories/${category.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete category."
        );
      }

      setCategories((current) =>
        current.filter(
          (item) => item.id !== category.id
        )
      );

      setSuccess("Category deleted successfully.");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete category."
      );
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1200px] p-6 lg:p-8">

        {/* HEADER */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e5253f] shadow-[0_0_10px_rgba(229,37,63,0.8)]" />

            <p className="font-technical text-xs uppercase tracking-[0.25em] text-[#e5253f]">
              AutoCore / Management / Categories
            </p>
          </div>

          <h1 className="font-display text-5xl tracking-wide text-white lg:text-6xl">
            CATEGORIES
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Organize automotive parts into simple inventory
            categories.
          </p>
        </section>

        {/* MESSAGES */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
            <p className="text-sm text-emerald-400">
              {success}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">

          {/* ADD CATEGORY */}
          <section className="h-fit rounded-2xl border border-white/8 bg-[#0e1117] p-6">
            <div className="mb-6">
              <h2 className="font-technical text-sm font-semibold uppercase tracking-[0.15em] text-white">
                Add Category
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Create a category for your parts inventory.
              </p>
            </div>

            <form
              onSubmit={handleAddCategory}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Category Name *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Brake System"
                  className="h-11 w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#e5253f]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  placeholder="Optional description..."
                  className="w-full rounded-xl border border-white/8 bg-[#080a0e] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#e5253f]/50"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-red w-full rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating..."
                  : "Create Category"}
              </button>
            </form>
          </section>

          {/* CATEGORY LIST */}
          <section className="rounded-2xl border border-white/8 bg-[#0e1117] p-6">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-technical text-sm font-semibold uppercase tracking-[0.15em] text-white">
                  Category List
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  {categories.length} categories registered
                </p>
              </div>

              <button
                type="button"
                onClick={loadCategories}
                className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400 transition hover:border-white/15 hover:text-white"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <p className="text-sm text-zinc-500">
                  Loading categories...
                </p>
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/8 py-12 text-center">
                <p className="text-sm text-zinc-500">
                  No categories found.
                </p>

                <p className="mt-1 text-xs text-zinc-700">
                  Create your first category using the form.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border border-white/8 bg-[#080a0e] p-4 transition hover:border-white/15"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="truncate text-sm font-semibold text-white">
                            {category.name}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
                              category.isActive
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-zinc-500/10 text-zinc-500"
                            }`}
                          >
                            {category.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        {category.description && (
                          <p className="mt-2 text-xs leading-5 text-zinc-500">
                            {category.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-zinc-600">
                          <span>
                            Parts:{" "}
                            <span className="text-zinc-400">
                              {category._count?.parts ?? 0}
                            </span>
                          </span>

                          <span>
                            Subcategories:{" "}
                            <span className="text-zinc-400">
                              {category._count?.children ?? 0}
                            </span>
                          </span>

                          {category.parent && (
                            <span>
                              Parent:{" "}
                              <span className="text-zinc-400">
                                {category.parent.name}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleCategory(category)
                          }
                          className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400 transition hover:border-white/15 hover:text-white"
                        >
                          {category.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteCategory(category)
                          }
                          className="rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-xs text-red-400 transition hover:border-red-500/25 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
}