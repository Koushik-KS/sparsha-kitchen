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
    <main className="min-h-screen bg-orange-50 text-zinc-900">
      {/* HEADER */}
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="group">
            <div className="text-2xl font-bold tracking-tight text-orange-600">
              Sparsha Kitchen
            </div>

            <div className="text-xs font-medium text-zinc-500">
              Homemade with care
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="font-medium text-zinc-700 hover:text-orange-600"
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
              className="font-medium text-zinc-700 hover:text-orange-600"
            >
              Custom Recipe
            </Link>

            <Link
              href="/track-order"
              className="font-medium text-zinc-700 hover:text-orange-600"
            >
              Track Order
            </Link>
          </nav>

          <Link
            href="/custom-recipe"
            className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Custom Recipe
          </Link>
        </div>
      </header>

      {/* PAGE INTRO */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold uppercase tracking-wide text-orange-600">
            Sparsha Kitchen
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Our Recipes
          </h1>

          <p className="mt-5 text-lg leading-8 text-zinc-600">
            Explore our homemade recipes and choose what you
            would like us to prepare for you.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="py-20 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />

            <p className="mt-5 text-zinc-600">
              Loading recipes...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="font-bold text-red-700">
              Unable to load recipes
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          recipes.length === 0 && (
            <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-orange-100 bg-white p-10 text-center shadow-sm">
              <div className="text-6xl">🍲</div>

              <h2 className="mt-5 text-2xl font-bold">
                No recipes available
              </h2>

              <p className="mt-3 text-zinc-600">
                Our recipes will appear here when they become
                available.
              </p>

              <Link
                href="/custom-recipe"
                className="mt-6 inline-block rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
              >
                Request a Custom Recipe
              </Link>
            </div>
          )}

        {/* RECIPE GRID */}
        {!loading &&
          !error &&
          recipes.length > 0 && (
            <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <article
                  key={recipe._id}
                  className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* IMAGE */}
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-orange-100">
                    {recipe.photos &&
                    recipe.photos.length > 0 ? (
                      <img
                        src={recipe.photos[0]}
                        alt={recipe.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-7xl">🍛</div>
                    )}

                    {!recipe.isAvailable && (
                      <div className="absolute right-4 top-4 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">
                        Currently unavailable
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold">
                      {recipe.name}
                    </h2>

                    {recipe.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                        {recipe.description}
                      </p>
                    )}

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          ₹{Number(recipe.price).toFixed(2)}
                        </div>

                        <div className="text-sm text-zinc-500">
                          per {recipe.unit}
                        </div>
                      </div>

                      <Link
                        href={`/recipes/${recipe._id}`}
                        className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
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
        <div className="mt-16 rounded-3xl bg-orange-600 px-8 py-10 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Can&apos;t find what you want?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-orange-50">
            Tell us what you are looking for and request a
            custom recipe from Sparsha Kitchen.
          </p>

          <Link
            href="/custom-recipe"
            className="mt-6 inline-block rounded-full bg-white px-7 py-3 font-semibold text-orange-700 hover:bg-orange-50"
          >
            Request Custom Recipe
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <div className="font-bold text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="text-sm text-zinc-500">
              Homemade food, prepared with care.
            </p>
          </div>

          <div className="flex gap-6 text-sm text-zinc-600">
            <Link href="/">Home</Link>
            <Link href="/custom-recipe">
              Custom Recipe
            </Link>
            <Link href="/track-order">
              Track Order
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}