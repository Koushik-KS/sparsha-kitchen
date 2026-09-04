"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

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

type OrderResponse = {
  success: boolean;
  message: string;
  order?: {
    id: string;
    orderId: string;
    status: string;
    foodTotal: number;
    grandTotal: number;
    trackingToken: string;
  };
};

const API_URL = "http://localhost:5000/api";

export default function RecipeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState("1");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [mapPin, setMapPin] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [additionalInstructions, setAdditionalInstructions] =
    useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState<OrderResponse["order"] | null>(null);

  // ==========================================
  // FETCH RECIPE
  // ==========================================

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/recipes/${id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Recipe not found"
          );
        }

        setRecipe(data.recipe);
      } catch (err) {
        console.error("Fetch recipe error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load recipe"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  // ==========================================
  // QUANTITY / PRICE
  // ==========================================

  const parsedQuantity = Number(quantity);

  const totalPrice =
    recipe &&
    Number.isFinite(parsedQuantity) &&
    parsedQuantity > 0
      ? parsedQuantity * Number(recipe.price)
      : 0;

  // ==========================================
  // SUBMIT ORDER
  // ==========================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!recipe) {
      return;
    }

    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError(
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (!deliveryAddress.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    if (!deliveryDate) {
      setError("Please select a delivery date.");
      return;
    }

    if (!deliveryTime) {
      setError("Please select a delivery time.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/orders`,
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

            deliveryAddress: deliveryAddress.trim(),
            mapPin: mapPin.trim(),

            requestedDeliveryDate: deliveryDate,
            requestedDeliveryTime: deliveryTime,

            additionalInstructions:
              additionalInstructions.trim(),

            items: [
              {
                recipeId: recipe._id,
                quantity: parsedQuantity,
              },
            ],
          }),
        }
      );

      const data: OrderResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to create order"
        );
      }

      if (!data.order) {
        throw new Error(
          "Order was created but no order details were returned."
        );
      }

      setSuccess(data.order);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Create order error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create order"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-orange-50">
        <header className="border-b border-orange-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <Link
              href="/"
              className="text-xl font-bold text-orange-600 sm:text-2xl"
            >
              Sparsha Kitchen
            </Link>
          </div>
        </header>

        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />

            <p className="mt-5 text-sm text-zinc-600 sm:text-base">
              Loading recipe...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // RECIPE ERROR
  // ==========================================

  if (error && !recipe) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-orange-50">
        <header className="border-b border-orange-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <Link
              href="/"
              className="text-xl font-bold text-orange-600 sm:text-2xl"
            >
              Sparsha Kitchen
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="text-5xl sm:text-6xl">
            🍲
          </div>

          <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
            Recipe not found
          </h1>

          <p className="mt-3 break-words text-sm leading-6 text-zinc-600 sm:text-base">
            {error}
          </p>

          <Link
            href="/recipes"
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 sm:w-auto sm:text-base"
          >
            Back to Recipes
          </Link>
        </div>
      </main>
    );
  }

  if (!recipe) {
    return null;
  }

  // ==========================================
  // ORDER SUCCESS
  // ==========================================

  if (success) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-orange-50 text-zinc-900">
        <header className="border-b border-orange-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <Link
              href="/"
              className="min-w-0 truncate text-xl font-bold text-orange-600 sm:text-2xl"
            >
              Sparsha Kitchen
            </Link>

            <Link
              href="/track-order"
              className="shrink-0 rounded-full bg-orange-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700 sm:px-5 sm:text-sm"
            >
              Track Order
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-20">
          <div className="rounded-2xl border border-green-200 bg-white p-5 text-center shadow-sm sm:rounded-3xl sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl sm:h-20 sm:w-20 sm:text-4xl">
              ✓
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-green-600 sm:mt-7">
              Order Request Received
            </p>

            <h1 className="mt-3 break-words text-2xl font-bold sm:text-4xl">
              Thank you, {name}!
            </h1>

            <p className="mt-4 text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7">
              Your order request has been received.
              Sparsha Kitchen will contact you for
              confirmation.
            </p>

            <div className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
              <div className="min-w-0 rounded-2xl bg-orange-50 p-4 sm:p-5">
                <div className="text-xs text-zinc-500 sm:text-sm">
                  Order ID
                </div>

                <div className="mt-1 break-all text-lg font-bold text-orange-600 sm:text-xl">
                  {success.orderId}
                </div>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4 sm:p-5">
                <div className="text-xs text-zinc-500 sm:text-sm">
                  Status
                </div>

                <div className="mt-1 break-words font-bold text-zinc-900">
                  {success.status}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 p-4 sm:mt-6 sm:p-5">
              <div className="text-xs text-zinc-500 sm:text-sm">
                Total
              </div>

              <div className="mt-1 text-xl font-bold sm:text-2xl">
                ₹{Number(success.grandTotal).toFixed(2)}
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-zinc-500 sm:mt-6 sm:text-sm sm:leading-6">
              Keep your Order ID and phone number
              available to track your order.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
              <Link
                href={`/track-order?orderId=${encodeURIComponent(
                  success.orderId
                )}`}
                className="inline-flex w-full items-center justify-center rounded-full bg-orange-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 sm:w-auto sm:text-base"
              >
                Track Order
              </Link>

              <Link
                href="/recipes"
                className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 px-7 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto sm:text-base"
              >
                Browse More Recipes
              </Link>
            </div>
          </div>
        </section>
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
            className="min-w-0 truncate text-xl font-bold tracking-tight text-orange-600 sm:text-2xl"
          >
            Sparsha Kitchen
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

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href="/recipes"
          className="inline-flex items-center text-sm font-medium text-orange-600 transition hover:text-orange-700 sm:text-base"
        >
          ← Back to Recipes
        </Link>

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-2 lg:gap-10">
          {/* RECIPE DETAILS */}
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm sm:rounded-3xl">
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-orange-100">
                {recipe.photos &&
                recipe.photos.length > 0 ? (
                  <img
                    src={recipe.photos[0]}
                    alt={recipe.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-6xl sm:text-8xl">
                    🍛
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-9">
                <div className="inline-flex rounded-full bg-orange-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-orange-700 sm:text-xs">
                  Homemade Recipe
                </div>

                <h1 className="mt-4 break-words text-3xl font-bold tracking-tight sm:mt-5 sm:text-5xl">
                  {recipe.name}
                </h1>

                {recipe.description && (
                  <p className="mt-4 break-words text-sm leading-7 text-zinc-600 sm:mt-5 sm:text-base sm:leading-8">
                    {recipe.description}
                  </p>
                )}

                <div className="mt-6 border-t border-zinc-100 pt-6 sm:mt-8 sm:pt-7">
                  <div className="text-2xl font-bold text-orange-600 sm:text-3xl">
                    ₹{Number(recipe.price).toFixed(2)}
                  </div>

                  <div className="mt-1 text-sm text-zinc-500">
                    per {recipe.unit}
                  </div>
                </div>

                {!recipe.isAvailable && (
                  <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium leading-6 text-red-700 sm:mt-6">
                    This recipe is currently unavailable for
                    ordering.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ORDER FORM */}
          <div className="min-w-0">
            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-9">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                  Place Order
                </p>

                <h2 className="mt-2 break-words text-2xl font-bold sm:text-3xl">
                  Order {recipe.name}
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  Fill in your details and delivery
                  preferences. Your order will be sent to
                  Sparsha Kitchen for confirmation.
                </p>
              </div>

              {error && (
                <div className="mt-5 break-words rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-700 sm:mt-6">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-6 sm:mt-8"
              >
                {/* QUANTITY */}
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-semibold text-zinc-800"
                  >
                    Quantity
                  </label>

                  <div className="mt-2 flex items-stretch gap-2 sm:gap-3">
                    <input
                      id="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(event.target.value)
                      }
                      className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                    />

                    <div className="flex shrink-0 items-center rounded-xl bg-orange-50 px-3 py-3 text-xs font-medium text-orange-700 sm:px-4 sm:text-sm">
                      {recipe.unit}
                    </div>
                  </div>
                </div>

                {/* CUSTOMER */}
                <div className="border-t border-zinc-100 pt-6">
                  <h3 className="font-bold">
                    Customer Details
                  </h3>

                  <div className="mt-4 space-y-4">
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

                    <div>
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

                {/* DELIVERY */}
                <div className="border-t border-zinc-100 pt-6">
                  <h3 className="font-bold">
                    Delivery Details
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="deliveryAddress"
                        className="block text-sm font-semibold"
                      >
                        Delivery Address *
                      </label>

                      <textarea
                        id="deliveryAddress"
                        required
                        rows={3}
                        value={deliveryAddress}
                        onChange={(event) =>
                          setDeliveryAddress(event.target.value)
                        }
                        placeholder="Enter your complete delivery address"
                        className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-3 py-3 text-sm leading-6 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="mapPin"
                        className="block text-sm font-semibold"
                      >
                        Map Pin
                        <span className="ml-1 font-normal text-zinc-400">
                          (optional)
                        </span>
                      </label>

                      <input
                        id="mapPin"
                        type="text"
                        value={mapPin}
                        onChange={(event) =>
                          setMapPin(event.target.value)
                        }
                        placeholder="Google Maps link or location pin"
                        className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="min-w-0">
                        <label
                          htmlFor="deliveryDate"
                          className="block text-sm font-semibold"
                        >
                          Delivery Date *
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
                          className="mt-2 w-full min-w-0 rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                        />
                      </div>

                      <div className="min-w-0">
                        <label
                          htmlFor="deliveryTime"
                          className="block text-sm font-semibold"
                        >
                          Delivery Time *
                        </label>

                        <input
                          id="deliveryTime"
                          type="time"
                          required
                          value={deliveryTime}
                          onChange={(event) =>
                            setDeliveryTime(event.target.value)
                          }
                          className="mt-2 w-full min-w-0 rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                        />
                      </div>
                    </div>

                    <div>
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
                        rows={3}
                        value={additionalInstructions}
                        onChange={(event) =>
                          setAdditionalInstructions(
                            event.target.value
                          )
                        }
                        placeholder="Any special instructions for your order?"
                        className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-3 py-3 text-sm leading-6 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* ORDER SUMMARY */}
                <div className="border-t border-zinc-100 pt-6">
                  <div className="rounded-2xl bg-orange-50 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <span className="min-w-0 break-words text-sm text-zinc-600">
                        {recipe.name}
                      </span>

                      <span className="shrink-0 text-right text-sm font-semibold">
                        {parsedQuantity > 0
                          ? parsedQuantity
                          : 0}{" "}
                        {recipe.unit}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4 border-t border-orange-100 pt-3">
                      <span className="font-bold">
                        Food Total
                      </span>

                      <span className="shrink-0 text-lg font-bold text-orange-600 sm:text-xl">
                        ₹{totalPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-4 text-sm text-zinc-500">
                      <span>Delivery Charge</span>
                      <span className="shrink-0">
                        ₹0.00
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4 border-t border-orange-100 pt-3">
                      <span className="font-bold">
                        Grand Total
                      </span>

                      <span className="shrink-0 text-lg font-bold sm:text-xl">
                        ₹{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={
                    submitting || !recipe.isAvailable
                  }
                  className="w-full rounded-full bg-orange-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
                >
                  {submitting
                    ? "Submitting Order..."
                    : recipe.isAvailable
                      ? "Place Order Request"
                      : "Recipe Unavailable"}
                </button>

                <p className="text-center text-xs leading-5 text-zinc-500">
                  Your order is a request until Sparsha
                  Kitchen confirms it.
                </p>
              </form>
            </div>
          </div>
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

          <Link
            href="/recipes"
            className="text-sm font-medium text-zinc-600 transition hover:text-orange-600"
          >
            Back to Recipes
          </Link>
        </div>
      </footer>
    </main>
  );
}