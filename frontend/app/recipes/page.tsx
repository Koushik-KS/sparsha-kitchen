"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Recipe = {
  _id: string;
  name: string;
  description?: string;
  photos?: string[];
  price: number;
  unit: string;
  isAvailable: boolean;
  isActive: boolean;
};

const API_URL = "http://localhost:5000/api";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/recipes`);

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load recipes"
          );
        }

        setRecipes(data.recipes || []);
      } catch (err) {
        console.error("Fetch recipes error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load recipes"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-orange-50 text-zinc-900">
      {/* HEADER */}
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <Link
            href="/"
            className="group min-w-0 shrink"
          >
            <div className="truncate text-xl font-bold tracking-tight text-orange-600 sm:text-2xl">
              Sparsha Kitchen
            </div>

            <div className="text-[11px] font-medium text-zinc-500 sm:text-xs">
              Homemade with care
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex lg:gap-8">
            <Link
              href="/"
              className="font-medium text-zinc-700 transition hover:text-orange-600"
            >
              Home
            </Link>

            <Link
              href="/recipes"
              className="font-medium text-orange-600"
            >
              Recipes
            </Link>

            <Link
              href="/custom-recipe"
              className="font-medium text-zinc-700 transition hover:text-orange-600"
            >
              Custom Recipe
            </Link>

            <Link
              href="/track-order"
              className="font-medium text-zinc-700 transition hover:text-orange-600"
            >
              Track Order
            </Link>
          </nav>

          <Link
            href="/custom-recipe"
            className="shrink-0 rounded-full bg-orange-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700 sm:px-5 sm:text-sm"
          >
            <span className="sm:hidden">Custom</span>
            <span className="hidden sm:inline">
              Custom Recipe
            </span>
          </Link>
        </div>
      </header>

      {/* PAGE INTRO */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Sparsha Kitchen
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Our Recipes
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:mt-5 sm:text-lg sm:leading-8">
            Explore our homemade recipes and choose what you
            would like us to prepare for you.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="py-16 text-center sm:py-20">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />

            <p className="mt-5 text-sm text-zinc-600 sm:text-base">
              Loading recipes...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-5 text-center sm:mt-12 sm:p-6">
            <h2 className="font-bold text-red-700">
              Unable to load recipes
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-red-600">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          recipes.length === 0 && (
            <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-orange-100 bg-white p-6 text-center shadow-sm sm:mt-12 sm:p-10">
              <div className="text-5xl sm:text-6xl">
                🍲
              </div>

              <h2 className="mt-5 text-xl font-bold sm:text-2xl">
                No recipes available
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">
                Our recipes will appear here when they become
                available.
              </p>

              <Link
                href="/custom-recipe"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 sm:w-auto sm:text-base"
              >
                Request a Custom Recipe
              </Link>
            </div>
          )}

        {/* RECIPE GRID */}
        {!loading &&
          !error &&
          recipes.length > 0 && (
            <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <article
                  key={recipe._id}
                  className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl"
                >
                  {/* IMAGE */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-orange-100">
                    {recipe.photos &&
                    recipe.photos.length > 0 ? (
                      <img
                        src={recipe.photos[0]}
                        alt={recipe.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-6xl sm:text-7xl">
                        🍛
                      </div>
                    )}

                    {!recipe.isAvailable && (
                      <div className="absolute right-3 top-3 max-w-[calc(100%-1.5rem)] rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white sm:right-4 sm:top-4 sm:text-xs">
                        Currently unavailable
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-4 sm:p-6">
                    <h2 className="break-words text-lg font-bold sm:text-xl">
                      {recipe.name}
                    </h2>

                    {recipe.description && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600 sm:mt-3">
                        {recipe.description}
                      </p>
                    )}

                    {/* PRICE + BUTTON */}
                    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <div className="text-xl font-bold text-orange-600 sm:text-2xl">
                          ₹{Number(recipe.price).toFixed(2)}
                        </div>

                        <div className="text-xs text-zinc-500 sm:text-sm">
                          per {recipe.unit}
                        </div>
                      </div>

                      <Link
                        href={`/recipes/${recipe._id}`}
                        className="inline-flex w-full items-center justify-center rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 sm:w-auto"
                      >
                        View Recipe
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        {/* CUSTOM RECIPE CTA */}
        <div className="mt-10 rounded-2xl bg-orange-600 px-5 py-8 text-center text-white sm:mt-16 sm:rounded-3xl sm:px-8 sm:py-10">
          <h2 className="text-xl font-bold sm:text-3xl">
            Can&apos;t find what you want?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-orange-50 sm:text-base sm:leading-7">
            Tell us what you are looking for and request a
            custom recipe from Sparsha Kitchen.
          </p>

          <Link
            href="/custom-recipe"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 sm:w-auto sm:text-base"
          >
            Request Custom Recipe
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 sm:py-8 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="font-bold text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              Homemade food, prepared with care.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600">
            <Link
              href="/"
              className="transition hover:text-orange-600"
            >
              Home
            </Link>

            <Link
              href="/custom-recipe"
              className="transition hover:text-orange-600"
            >
              Custom Recipe
            </Link>

            <Link
              href="/track-order"
              className="transition hover:text-orange-600"
            >
              Track Order
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}