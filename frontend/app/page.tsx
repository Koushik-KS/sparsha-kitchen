"use client";

import Link from "next/link";

const features = [
  {
    title: "Browse Recipes",
    description:
      "Explore our available homemade recipes and choose what you would like to order.",
    href: "/recipes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-7 w-7"
      >
        <path d="M4 3v18" />
        <path d="M8 3v7a2 2 0 0 1-4 0V3" />
        <path d="M6 10v11" />
        <path d="M14 3v18" />
        <path d="M14 3c3 1 4 3.5 4 6v2h-4" />
      </svg>
    ),
  },
  {
    title: "Custom Recipe",
    description:
      "Can't find what you are looking for? Request a custom recipe from Sparsha Kitchen.",
    href: "/custom-recipe",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-7 w-7"
      >
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
        <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16z" />
      </svg>
    ),
  },
  {
    title: "Track Order",
    description:
      "Track your order status using your Order ID and registered phone number.",
    href: "/track-order",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-7 w-7"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />
        <path d="M3 9h18" />
        <path d="M7 14h4" />
        <path d="M15 14h2" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
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
              className="font-medium text-orange-600"
            >
              Home
            </Link>

            <Link
              href="/recipes"
              className="font-medium text-zinc-700 transition hover:text-orange-600"
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
            href="/recipes"
            className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Order Now
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-orange-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <path d="M7 3v8" />
                <path d="M4 3v5a3 3 0 0 0 6 0V3" />
                <path d="M7 11v10" />
                <path d="M17 3v18" />
                <path d="M17 3c2.2 1.1 3 3.1 3 5.5V10h-3" />
              </svg>

              Fresh • Homemade • Made with Care
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-6xl">
              Delicious food,
              <span className="block text-orange-600">
                made with sparsha.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              Welcome to Sparsha Kitchen. Discover
              homemade recipes, request something special,
              and get your food prepared with care.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/recipes"
                className="rounded-full bg-orange-600 px-7 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-orange-700"
              >
                Explore Recipes
              </Link>

              <Link
                href="/custom-recipe"
                className="rounded-full border border-orange-200 bg-white px-7 py-3.5 text-center font-semibold text-orange-700 transition hover:bg-orange-100"
              >
                Request Custom Recipe
              </Link>
            </div>
          </div>

          {/* HERO FOOD IMAGE */}
          <div className="relative">
            <div className="mx-auto flex aspect-square max-w-lg items-center justify-center overflow-hidden rounded-[3rem] bg-white shadow-xl shadow-orange-100">
              <img
                src="/demo.png"
                alt="Sparsha Kitchen homemade food"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold text-orange-600">
              HOW IT WORKS
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Everything you need in one place
            </h2>

            <p className="mt-4 text-zinc-600">
              Choose a recipe, request something custom, or
              track your existing order.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-xl font-bold text-zinc-900 group-hover:text-orange-600">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-zinc-600">
                  {feature.description}
                </p>

                <div className="mt-6 font-semibold text-orange-600">
                  Get started →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOM RECIPE CTA */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-orange-600 px-8 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-semibold text-orange-100">
                HAVE SOMETHING SPECIAL IN MIND?
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Request your own custom recipe.
              </h2>

              <p className="mt-4 leading-7 text-orange-50">
                Tell us what you want, choose your quantity
                and preferred delivery time, and our team
                will contact you with a quote.
              </p>
            </div>

            <Link
              href="/custom-recipe"
              className="mt-8 inline-block rounded-full bg-white px-7 py-3.5 font-semibold text-orange-700 transition hover:bg-orange-50 lg:mt-0"
            >
              Request Custom Recipe
            </Link>
          </div>
        </div>
      </section>

      {/* TRACK ORDER */}
      <section className="bg-zinc-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
              />
              <path d="M3 9h18" />
              <path d="M7 14h4" />
              <path d="M15 14h2" />
            </svg>
          </div>

          <h2 className="mt-5 text-3xl font-bold text-zinc-900">
            Already placed an order?
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-zinc-600">
            Check your order status anytime using your
            Order ID and phone number.
          </p>

          <Link
            href="/track-order"
            className="mt-7 inline-block rounded-full bg-zinc-900 px-7 py-3.5 font-semibold text-white transition hover:bg-zinc-800"
          >
            Track My Order
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <div className="font-bold text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              Homemade food, prepared with care.
            </p>
          </div>

          <div className="flex gap-6 text-sm text-zinc-600">
            <Link
              href="/recipes"
              className="transition hover:text-orange-600"
            >
              Recipes
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