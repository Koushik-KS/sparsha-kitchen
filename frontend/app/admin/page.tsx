"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api";

type Recipe = {
  _id: string;
  name: string;
  description: string;
  photos: string[];
  price: number;
  unit: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type RecipeResponse = {
  success: boolean;
  message?: string;
  recipe?: Recipe;
  recipes?: Recipe[];
};

export default function AdminPage() {
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const getToken = useCallback(() => {
    return localStorage.getItem("adminToken");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    router.push("/admin/login");
  }, [router]);

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch(`${API_URL}/admin/recipes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data: RecipeResponse = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load recipes."
        );
      }

      setRecipes(data.recipes || []);
    } catch (err) {
      console.error("Fetch admin recipes error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recipes."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, logout, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchRecipes();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchRecipes]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPhotos("");
    setPrice("");
    setUnit("");
    setIsAvailable(true);
    setIsActive(true);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter the recipe name.");
      return;
    }

    if (!price.trim()) {
      setError("Please enter the recipe price.");
      return;
    }

    if (!unit.trim()) {
      setError("Please enter the recipe unit.");
      return;
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setError(
        "Price must be a valid number greater than or equal to zero."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    const photoList = photos
      .split("\n")
      .map((photo) => photo.trim())
      .filter(Boolean);

    try {
      setSaving(true);

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `${API_URL}/admin/recipes/${editingId}`
          : `${API_URL}/admin/recipes`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            photos: photoList,
            price: numericPrice,
            unit: unit.trim(),
            isAvailable,
            isActive,
          }),
        }
      );

      const data: RecipeResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Unable to update recipe."
              : "Unable to create recipe.")
        );
      }

      setMessage(
        data.message ||
          (isEditing
            ? "Recipe updated successfully."
            : "Recipe created successfully.")
      );

      resetForm();

      await fetchRecipes();
    } catch (err) {
      console.error("Save recipe error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save recipe."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setError("");
    setMessage("");

    setEditingId(recipe._id);
    setName(recipe.name);
    setDescription(recipe.description || "");
    setPhotos((recipe.photos || []).join("\n"));
    setPrice(String(recipe.price));
    setUnit(recipe.unit);
    setIsAvailable(recipe.isAvailable);
    setIsActive(recipe.isActive);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (recipe: Recipe) => {
    const confirmed = window.confirm(
      `Delete "${recipe.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/recipes/${recipe._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: RecipeResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to delete recipe."
        );
      }

      if (editingId === recipe._id) {
        resetForm();
      }

      setMessage(
        data.message || "Recipe deleted successfully."
      );

      await fetchRecipes();
    } catch (err) {
      console.error("Delete recipe error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete recipe."
      );
    }
  };

  const updateRecipeStatus = async (
    recipe: Recipe,
    changes: {
      isAvailable?: boolean;
      isActive?: boolean;
    }
  ) => {
    setError("");
    setMessage("");

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/recipes/${recipe._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(changes),
        }
      );

      const data: RecipeResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update recipe."
        );
      }

      setMessage(
        data.message || "Recipe updated successfully."
      );

      await fetchRecipes();
    } catch (err) {
      console.error(
        "Update recipe status error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update recipe."
      );
    }
  };

  const handleToggleAvailability = async (
    recipe: Recipe
  ) => {
    await updateRecipeStatus(recipe, {
      isAvailable: !recipe.isAvailable,
    });
  };

  const handleToggleActive = async (
    recipe: Recipe
  ) => {
    await updateRecipeStatus(recipe, {
      isActive: !recipe.isActive,
    });
  };

  return (
    <main className="min-h-screen bg-orange-50 text-zinc-900">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <div className="text-2xl font-bold tracking-tight text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="text-xs font-medium text-zinc-500">
              Admin Panel
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/orders")}
              className="rounded-full border border-orange-200 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Orders
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div>
          <p className="font-semibold uppercase tracking-wide text-orange-600">
            Dashboard
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Manage Recipes
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-600">
            Create, update, activate, deactivate, and
            remove recipes displayed on the Sparsha
            Kitchen website.
          </p>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="h-fit rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">
            <div>
              <p className="font-semibold uppercase tracking-wide text-orange-600">
                {editingId ? "Edit Recipe" : "Add Recipe"}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {editingId
                  ? "Update recipe"
                  : "Create a new recipe"}
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold"
                >
                  Recipe Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Example: Chicken Biryani"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe the recipe..."
                  className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="photos"
                  className="block text-sm font-semibold"
                >
                  Photo URLs
                </label>

                <textarea
                  id="photos"
                  rows={3}
                  value={photos}
                  onChange={(event) =>
                    setPhotos(event.target.value)
                  }
                  placeholder="One image URL per line"
                  className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Add one image URL per line.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-semibold"
                  >
                    Price
                  </label>

                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    placeholder="0.00"
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="unit"
                    className="block text-sm font-semibold"
                  >
                    Unit
                  </label>

                  <input
                    id="unit"
                    type="text"
                    value={unit}
                    onChange={(event) =>
                      setUnit(event.target.value)
                    }
                    placeholder="kg / plate / box"
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-zinc-100 pt-5">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(event) =>
                      setIsAvailable(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 accent-orange-600"
                  />

                  <span className="text-sm font-semibold">
                    Available for ordering
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) =>
                      setIsActive(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 accent-orange-600"
                  />

                  <span className="text-sm font-semibold">
                    Visible on website
                  </span>
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-full bg-orange-600 px-6 py-3.5 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Recipe"
                      : "Create Recipe"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="rounded-full border border-zinc-200 px-6 py-3.5 font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Recipes
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {recipes.length}{" "}
                  {recipes.length === 1
                    ? "recipe"
                    : "recipes"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void fetchRecipes()}
                disabled={loading}
                className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />

                <p className="mt-5 text-zinc-600">
                  Loading recipes...
                </p>
              </div>
            ) : recipes.length === 0 ? (
              <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
                <div className="text-6xl">🍲</div>

                <h3 className="mt-5 text-xl font-bold">
                  No recipes yet
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  Create your first recipe using the
                  form.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {recipes.map((recipe) => (
                  <article
                    key={recipe._id}
                    className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm"
                  >
                    <div className="p-6">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold">
                              {recipe.name}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                recipe.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-zinc-100 text-zinc-500"
                              }`}
                            >
                              {recipe.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                recipe.isAvailable
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {recipe.isAvailable
                                ? "Available"
                                : "Unavailable"}
                            </span>
                          </div>

                          {recipe.description && (
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                              {recipe.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                            <span className="font-bold text-orange-600">
                              ₹
                              {Number(
                                recipe.price
                              ).toFixed(2)}
                            </span>

                            <span className="text-zinc-500">
                              per {recipe.unit}
                            </span>

                            <span className="text-zinc-400">
                              {recipe.photos?.length || 0}{" "}
                              photo
                              {recipe.photos?.length === 1
                                ? ""
                                : "s"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(recipe)
                            }
                            className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(recipe)
                            }
                            className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-100 pt-5">
                        <button
                          type="button"
                          onClick={() =>
                            void handleToggleAvailability(
                              recipe
                            )
                          }
                          className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
                        >
                          {recipe.isAvailable
                            ? "Mark Unavailable"
                            : "Mark Available"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleToggleActive(
                              recipe
                            )
                          }
                          className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200"
                        >
                          {recipe.isActive
                            ? "Hide from Website"
                            : "Show on Website"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}