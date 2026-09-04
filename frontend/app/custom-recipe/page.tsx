"use client";

import Link from "next/link";
import { useState } from "react";

const API_URL = "http://localhost:5000/api";

export default function CustomRecipePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [recipeName, setRecipeName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [additionalInstructions, setAdditionalInstructions] =
    useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    id: string;
    recipeName: string;
    status: string;
    createdAt: string;
  } | null>(null);

  // ==========================================
  // SUBMIT REQUEST
  // ==========================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!recipeName.trim()) {
      setError("Please enter the recipe name.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the recipe you want.");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (!unit.trim()) {
      setError("Please enter the quantity unit.");
      return;
    }

    if (!deliveryDate) {
      setError("Please select a preferred delivery date.");
      return;
    }

    if (!deliveryTime) {
      setError("Please select a preferred delivery time.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/custom-recipes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: {
              name: name.trim(),
              phone: phone.trim(),
              email: email.trim().toLowerCase(),
            },

            recipeName: recipeName.trim(),

            description: description.trim(),

            quantity: parsedQuantity,

            unit: unit.trim(),

            preferredDeliveryDate: deliveryDate,

            preferredDeliveryTime: deliveryTime,

            additionalInstructions:
              additionalInstructions.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit custom recipe request."
        );
      }

      if (!data.customRecipe) {
        throw new Error(
          "Request submitted but no request details were returned."
        );
      }

      setSuccess({
        id: data.customRecipe.id,
        recipeName: data.customRecipe.recipeName,
        status: data.customRecipe.status,
        createdAt: data.customRecipe.createdAt,
      });

      // Clear form
      setName("");
      setPhone("");
      setEmail("");
      setRecipeName("");
      setDescription("");
      setQuantity("1");
      setUnit("");
      setDeliveryDate("");
      setDeliveryTime("");
      setAdditionalInstructions("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Create custom recipe request error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit custom recipe request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // SUCCESS
  // ==========================================

  if (success) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-orange-50 text-zinc-900">
        {/* HEADER */}
        <header className="border-b border-orange-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <Link
              href="/"
              className="group min-w-0"
            >
              <div className="truncate text-xl font-bold tracking-tight text-orange-600 sm:text-2xl">
                Sparsha Kitchen
              </div>

              <div className="text-[11px] font-medium text-zinc-500 sm:text-xs">
                Homemade with care
              </div>
            </Link>

            <Link
              href="/recipes"
              className="shrink-0 rounded-full bg-orange-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700 sm:px-5 sm:text-sm"
            >
              <span className="sm:hidden">Recipes</span>
              <span className="hidden sm:inline">
                Browse Recipes
              </span>
            </Link>
          </div>
        </header>

        {/* SUCCESS CONTENT */}
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-20">
          <div className="rounded-2xl border border-green-200 bg-white p-5 text-center shadow-sm sm:rounded-3xl sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700 sm:h-20 sm:w-20 sm:text-4xl">
              ✓
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-green-600 sm:mt-7">
              Request Received
            </p>

            <h1 className="mt-3 text-2xl font-bold sm:text-4xl">
              Thank you!
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7">
              Your custom recipe request has been received.
              Sparsha Kitchen will review your request and
              contact you with the details and quotation.
            </p>

            <div className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
              <div className="min-w-0 rounded-2xl bg-orange-50 p-4 sm:p-5">
                <div className="text-xs text-zinc-500 sm:text-sm">
                  Recipe
                </div>

                <div className="mt-1 break-words text-base font-bold sm:text-lg">
                  {success.recipeName}
                </div>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4 sm:p-5">
                <div className="text-xs text-zinc-500 sm:text-sm">
                  Status
                </div>

                <div className="mt-1 break-words font-bold text-orange-600">
                  {success.status}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 p-4 sm:mt-6 sm:p-5">
              <div className="text-xs text-zinc-500 sm:text-sm">
                Request ID
              </div>

              <div className="mt-1 break-all text-sm font-bold text-zinc-900">
                {success.id}
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-zinc-500 sm:mt-6 sm:text-sm sm:leading-6">
              Please keep your request details available
              when communicating with Sparsha Kitchen.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
              <Link
                href="/recipes"
                className="inline-flex w-full items-center justify-center rounded-full bg-orange-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 sm:w-auto sm:text-base"
              >
                Browse Recipes
              </Link>

              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 px-7 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto sm:text-base"
              >
                Back Home
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-orange-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
            <div className="font-bold text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              Homemade food, prepared with care.
            </p>
          </div>
        </footer>
      </main>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-orange-50 text-zinc-900">
      {/* HEADER */}
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <Link
            href="/"
            className="group min-w-0"
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
              className="font-medium text-zinc-700 transition hover:text-orange-600"
            >
              Recipes
            </Link>

            <Link
              href="/custom-recipe"
              className="font-medium text-orange-600"
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
            className="shrink-0 rounded-full bg-orange-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700 sm:px-5 sm:text-sm"
          >
            <span className="sm:hidden">Recipes</span>
            <span className="hidden sm:inline">
              Browse Recipes
            </span>
          </Link>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        {/* INTRO */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Custom Recipe
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Tell Us What You&apos;re Craving
          </h1>

          <p className="mt-4 text-sm leading-6 text-zinc-600 sm:mt-5 sm:text-lg sm:leading-8">
            Can&apos;t find the recipe you want? Tell us what
            you are looking for and Sparsha Kitchen will review
            your request and provide a quotation.
          </p>
        </div>

        {/* FORM CARD */}
        <div className="mt-8 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:mt-12 sm:rounded-3xl sm:p-10">
          {error && (
            <div className="break-words rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-2 space-y-7 sm:space-y-8"
          >
            {/* CUSTOMER DETAILS */}
            <div>
              <h2 className="text-lg font-bold sm:text-xl">
                Customer Details
              </h2>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Tell us how we can contact you.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {/* NAME */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold"
                  >
                    Full Name *
                  </label>

                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Your full name"
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                  />
                </div>

                {/* PHONE */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold"
                  >
                    Phone Number *
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10)
                      )
                    }
                    placeholder="Your phone number"
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                  />
                </div>

                {/* EMAIL */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold"
                  >
                    Email
                    <span className="ml-1 font-normal text-zinc-400">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                  />
                </div>
              </div>
            </div>

            {/* RECIPE DETAILS */}
            <div className="border-t border-zinc-100 pt-7 sm:pt-8">
              <h2 className="text-lg font-bold sm:text-xl">
                Recipe Details
              </h2>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Describe the food you would like us to prepare.
              </p>

              <div className="mt-5 space-y-5">
                {/* RECIPE NAME */}
                <div>
                  <label
                    htmlFor="recipeName"
                    className="block text-sm font-semibold"
                  >
                    Recipe Name *
                  </label>

                  <input
                    id="recipeName"
                    type="text"
                    required
                    value={recipeName}
                    onChange={(event) =>
                      setRecipeName(event.target.value)
                    }
                    placeholder="Example: Chicken Biryani"
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold"
                  >
                    Recipe Description *
                  </label>

                  <textarea
                    id="description"
                    required
                    rows={5}
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Describe the recipe, ingredients, style, taste, or preparation you want."
                    className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-3 py-3 text-sm leading-6 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                  />
                </div>

                {/* QUANTITY + UNIT */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label
                      htmlFor="quantity"
                      className="block text-sm font-semibold"
                    >
                      Quantity *
                    </label>

                    <input
                      id="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(event.target.value)
                      }
                      className="mt-2 w-full min-w-0 rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                    />
                  </div>

                  <div className="min-w-0">
                    <label
                      htmlFor="unit"
                      className="block text-sm font-semibold"
                    >
                      Unit *
                    </label>

                    <input
                      id="unit"
                      type="text"
                      required
                      value={unit}
                      onChange={(event) =>
                        setUnit(event.target.value)
                      }
                      placeholder="kg, plate, box, litre..."
                      className="mt-2 w-full min-w-0 rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* DELIVERY */}
            <div className="border-t border-zinc-100 pt-7 sm:pt-8">
              <h2 className="text-lg font-bold sm:text-xl">
                Preferred Delivery
              </h2>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Let us know when you would like the food.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {/* DATE */}
                <div className="min-w-0">
                  <label
                    htmlFor="deliveryDate"
                    className="block text-sm font-semibold"
                  >
                    Preferred Delivery Date *
                  </label>

                  <input
                    id="deliveryDate"
                    type="date"
                    required
                    min={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    value={deliveryDate}
                    onChange={(event) =>
                      setDeliveryDate(event.target.value)
                    }
                    className="mt-2 w-full min-w-0 rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                  />
                </div>

                {/* TIME */}
                <div className="min-w-0">
                  <label
                    htmlFor="deliveryTime"
                    className="block text-sm font-semibold"
                  >
                    Preferred Delivery Time *
                  </label>

                  <input
                    id="deliveryTime"
                    type="time"
                    required
                    value={deliveryTime}
                    onChange={(event) =>
                      setDeliveryTime(event.target.value)
                    }
                    className="mt-2 w-full min-w-0 rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                  />
                </div>
              </div>
            </div>

            {/* INSTRUCTIONS */}
            <div className="border-t border-zinc-100 pt-7 sm:pt-8">
              <label
                htmlFor="additionalInstructions"
                className="block text-sm font-semibold"
              >
                Additional Instructions
                <span className="ml-1 font-normal text-zinc-400">
                  (optional)
                </span>
              </label>

              <textarea
                id="additionalInstructions"
                rows={4}
                value={additionalInstructions}
                onChange={(event) =>
                  setAdditionalInstructions(
                    event.target.value
                  )
                }
                placeholder="Any special instructions, preferences, allergies, packaging requests, etc."
                className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-3 py-3 text-sm leading-6 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
              />
            </div>

            {/* INFO */}
            <div className="rounded-2xl bg-orange-50 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="shrink-0 text-lg sm:text-xl">
                  💡
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-orange-800">
                    How it works
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-orange-700">
                    Submit your request and Sparsha Kitchen
                    will review it. We will contact you with
                    availability and a quotation. You can then
                    decide whether to accept the quote.
                  </p>
                </div>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-orange-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
            >
              {submitting
                ? "Submitting Request..."
                : "Request Custom Recipe"}
            </button>

            <p className="text-center text-xs leading-5 text-zinc-500">
              Submitting this form does not place an order.
              It only sends a custom recipe request for review.
            </p>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:px-6 sm:py-8 md:flex-row md:items-center md:justify-between lg:px-8">
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
              href="/recipes"
              className="transition hover:text-orange-600"
            >
              Recipes
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