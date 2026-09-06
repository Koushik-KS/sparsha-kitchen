"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type BusinessSettings = {
  phoneNumber: string;
  whatsappNumber: string;
  instagramUrl: string;
};

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
  const [businessSettings, setBusinessSettings] =
    useState<BusinessSettings>({
      phoneNumber: "",
      whatsappNumber: "",
      instagramUrl: "",
    });

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await fetch(
          `${API_URL}/business-settings`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (
          response.ok &&
          data.success &&
          data.settings
        ) {
          setBusinessSettings({
            phoneNumber:
              data.settings.phoneNumber || "",
            whatsappNumber:
              data.settings.whatsappNumber || "",
            instagramUrl:
              data.settings.instagramUrl || "",
          });
        }
      } catch (error) {
        console.error(
          "Fetch business settings error:",
          error
        );
      }
    };

    void fetchBusinessSettings();
  }, []);

  // ==========================================
  // WHATSAPP URL
  // ==========================================

  const getWhatsAppUrl = (phone: string) => {
    const digits = String(phone || "").replace(
      /\D/g,
      ""
    );

    let whatsappNumber = digits;

    if (digits.length === 10) {
      whatsappNumber = `91${digits}`;
    } else if (
      digits.startsWith("0") &&
      digits.length === 11
    ) {
      whatsappNumber = `91${digits.slice(1)}`;
    }

    return `https://wa.me/${whatsappNumber}`;
  };

  // ==========================================
  // PHONE URL
  // ==========================================

  const getPhoneUrl = (phone: string) => {
    return `tel:${String(phone || "").replace(
      /\s/g,
      ""
    )}`;
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-900">
      {/* ==========================================
          HEADER
      ========================================== */}

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
            className="shrink-0 rounded-full bg-orange-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700 sm:px-5 sm:text-sm"
          >
            Order Now
          </Link>
        </div>
      </header>

      {/* ==========================================
          HERO
      ========================================== */}

      <section className="relative overflow-hidden bg-orange-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 md:gap-12 lg:grid-cols-2 lg:px-8 lg:py-24">
          {/* HERO TEXT */}

          <div className="min-w-0">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full bg-orange-100 px-3.5 py-2 text-xs font-semibold text-orange-700 sm:px-4 sm:text-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4 shrink-0"
              >
                <path d="M7 3v8" />
                <path d="M4 3v5a3 3 0 0 0 6 0V3" />
                <path d="M7 11v10" />
                <path d="M17 3v18" />
                <path d="M17 3c2.2 1.1 3 3.1 3 5.5V10h-3" />
              </svg>

              <span className="truncate">
                Fresh • Homemade • Made with Care
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl md:text-6xl">
              Delicious food,
              <span className="block text-orange-600">
                made with sparsha.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:mt-6 sm:text-lg sm:leading-8">
              Welcome to Sparsha Kitchen. Discover
              homemade recipes, request something special,
              and get your food prepared with care.
            </p>

            {/* MAIN BUTTONS */}

            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
              <Link
                href="/recipes"
                className="w-full rounded-full bg-orange-600 px-6 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-orange-700 sm:w-auto sm:px-7"
              >
                Explore Recipes
              </Link>

              <Link
                href="/custom-recipe"
                className="w-full rounded-full border border-orange-200 bg-white px-6 py-3.5 text-center font-semibold text-orange-700 transition hover:bg-orange-100 sm:w-auto sm:px-7"
              >
                Request Custom Recipe
              </Link>
            </div>

            {/* ==========================================
                BUSINESS CONTACT ICONS
                ONLY ICONS — NO IMAGES
            ========================================== */}

            {(businessSettings.phoneNumber ||
              businessSettings.whatsappNumber ||
              businessSettings.instagramUrl) && (
              <div className="mt-7 flex items-center gap-3">
                {/* CALL */}

                {businessSettings.phoneNumber && (
                  <a
                    href={getPhoneUrl(
                      businessSettings.phoneNumber
                    )}
                    aria-label="Call Sparsha Kitchen"
                    title="Call Sparsha Kitchen"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-100 hover:shadow-md"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </a>
                )}

                {/* WHATSAPP */}

                {businessSettings.whatsappNumber && (
                  <a
                    href={getWhatsAppUrl(
                      businessSettings.whatsappNumber
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp Sparsha Kitchen"
                    title="WhatsApp Sparsha Kitchen"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-100 hover:shadow-md"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .15 5.35.15 11.92c0 2.1.55 4.15 1.6 5.96L.05 24l6.27-1.64a11.9 11.9 0 0 0 5.75 1.47h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.17-3.48-8.43ZM12.08 21.85h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.72.97.99-3.63-.23-.37a9.9 9.9 0 0 1-1.52-5.31C2.18 6.44 6.62 2 12.08 2c2.65 0 5.14 1.03 7.02 2.92a9.86 9.86 0 0 1 2.9 7c0 5.46-4.44 9.9-9.92 9.93Zm5.43-7.42c-.3-.15-1.78-.88-2.05-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.5 1.71.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.44.25-.71.25-1.32.17-1.44-.07-.12-.27-.2-.57-.35Z" />
                    </svg>
                  </a>
                )}

                {/* INSTAGRAM */}

                {businessSettings.instagramUrl && (
                  <a
                    href={
                      businessSettings.instagramUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram Sparsha Kitchen"
                    title="Instagram Sparsha Kitchen"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-100 hover:shadow-md"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="5"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="4"
                      />

                      <circle
                        cx="17.5"
                        cy="6.5"
                        r="1"
                        fill="currentColor"
                        stroke="none"
                      />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* HERO FOOD IMAGE */}

          <div className="relative w-full">
            <div className="mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-orange-100 sm:max-w-lg sm:rounded-[3rem]">
              <img
                src="/demo.png"
                alt="Sparsha Kitchen homemade food"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          FEATURES
      ========================================== */}

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-orange-600">
              HOW IT WORKS
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
              Everything you need in one place
            </h2>

            <p className="mt-4 text-sm leading-6 text-zinc-600 sm:text-base">
              Choose a recipe, request something custom, or
              track your existing order.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg sm:rounded-3xl sm:p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 sm:h-14 sm:w-14 sm:rounded-2xl">
                  {feature.icon}
                </div>

                <h3 className="mt-5 text-lg font-bold text-zinc-900 group-hover:text-orange-600 sm:mt-6 sm:text-xl">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-zinc-600 sm:leading-7">
                  {feature.description}
                </p>

                <div className="mt-5 text-sm font-semibold text-orange-600 sm:mt-6">
                  Get started →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          CUSTOM RECIPE CTA
      ========================================== */}

      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-3xl bg-orange-600 px-6 py-9 text-white sm:rounded-[2rem] sm:px-12 sm:py-12 lg:flex lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-orange-100">
                HAVE SOMETHING SPECIAL IN MIND?
              </p>

              <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
                Request your own custom recipe.
              </h2>

              <p className="mt-4 text-sm leading-6 text-orange-50 sm:text-base sm:leading-7">
                Tell us what you want, choose your quantity
                and preferred delivery time, and our team
                will contact you with a quote.
              </p>
            </div>

            <Link
              href="/custom-recipe"
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-center font-semibold text-orange-700 transition hover:bg-orange-50 sm:w-auto sm:px-7 lg:mt-0"
            >
              Request Custom Recipe
            </Link>
          </div>
        </div>
      </section>

      {/* ==========================================
          TRACK ORDER
      ========================================== */}

      <section className="bg-zinc-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 sm:h-14 sm:w-14 sm:rounded-2xl">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6 sm:h-7 sm:w-7"
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

          <h2 className="mt-5 text-2xl font-bold text-zinc-900 sm:text-3xl">
            Already placed an order?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7">
            Check your order status anytime using your
            Order ID and phone number.
          </p>

          <Link
            href="/track-order"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-6 py-3.5 font-semibold text-white transition hover:bg-zinc-800 sm:mt-7 sm:w-auto sm:px-7"
          >
            Track My Order
          </Link>
        </div>
      </section>

      {/* ==========================================
          FOOTER
      ========================================== */}

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 sm:py-8 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="font-bold text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              Homemade food, prepared with care.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600 sm:gap-6">
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