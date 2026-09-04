"use client";

import { FormEvent, useState } from "react";

const API_URL = "http://localhost:5000/api";

type SuccessData = {
  trackId: string;
  recipeName: string;
  status: string;
  createdAt: string;
};

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  recipeName: "",
  description: "",
  quantity: "1",
  unit: "kg",
  deliveryDate: "",
  deliveryTime: "",
  deliveryAddress: "",
  mapPin: "",
  additionalInstructions: "",
};

export default function CustomRecipePage() {
  const [formData, setFormData] = useState(emptyForm);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "phone") {
      setFormData((previous) => ({
        ...previous,
        phone: value.replace(/\D/g, "").slice(0, 10),
      }));
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (formData.phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!formData.deliveryAddress.trim()) {
      setError("Please enter your complete delivery address.");
      return;
    }

    const quantity = Number(formData.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/custom-recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
          },
          recipeName: formData.recipeName.trim(),
          description: formData.description.trim(),
          quantity,
          unit: formData.unit.trim(),
          preferredDeliveryDate: formData.deliveryDate,
          preferredDeliveryTime: formData.deliveryTime,
          deliveryAddress: formData.deliveryAddress.trim(),
          mapPin: formData.mapPin.trim(),
          additionalInstructions:
            formData.additionalInstructions.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to submit custom recipe request."
        );
      }

      setSuccess({
        trackId: data.customRecipe?.trackId || "",
        recipeName:
          data.customRecipe?.recipeName || formData.recipeName,
        status: data.customRecipe?.status || "PENDING",
        createdAt:
          data.customRecipe?.createdAt || new Date().toISOString(),
      });

      setFormData({ ...emptyForm });
    } catch (err) {
      console.error("Custom recipe submission error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto w-full max-w-2xl">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
            <div className="h-1.5 bg-orange-500" />

            <div className="p-6 sm:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/60">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <span className="text-3xl font-bold text-green-600">
                    ✓
                  </span>
                </div>
              </div>

              <h1 className="mt-7 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Custom Recipe Request Submitted
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-gray-600 sm:text-base">
                Your request has been received successfully. Save your
                Track ID and use it with your phone number on the Track
                Order page.
              </p>

              <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-6">
                <p className="text-center text-xs font-semibold uppercase tracking-widest text-orange-700">
                  Your Track ID
                </p>

                <div className="mt-3 rounded-xl border border-orange-200 bg-white px-4 py-4">
                  <p className="break-all text-center text-xl font-bold tracking-wider text-gray-900 sm:text-2xl">
                    {success.trackId || "Track ID unavailable"}
                  </p>
                </div>

                <p className="mt-3 text-center text-xs text-gray-500">
                  Keep this ID safe for tracking.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                <span className="text-sm font-medium text-gray-700">
                  Current Status
                </span>

                <span className="rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-700">
                  {success.status}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Recipe
                </p>

                <p className="mt-1 text-base font-semibold text-gray-900">
                  {success.recipeName}
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <a
                  href="/track-order"
                  className="flex min-h-12 items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
                >
                  Track My Request
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSuccess(null);
                    setError("");
                  }}
                  className="min-h-12 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  Submit Another Request
                </button>
              </div>

              <p className="mt-6 text-center text-xs leading-5 text-gray-500">
                Once Admin approves your request, it will automatically
                become a normal order using the same Track ID.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Special Request
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Custom Recipe
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Tell us what you would like us to prepare. Our team will
            review your request and get back to you.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="h-1.5 bg-orange-500" />

          <div className="p-5 sm:p-8">
            {error && (
              <div className="mb-7 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                  !
                </div>
                <p className="text-sm leading-6 text-red-700">{error}</p>
              </div>
            )}

            <section>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-600">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Customer Information
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Tell us how we can contact you.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Full Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    placeholder="Enter your full name"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Phone Number <span className="text-orange-500">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    autoComplete="tel"
                    placeholder="Enter 10-digit number"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                  <div className="mt-1.5 flex justify-between">
                    <span className="text-xs text-gray-400">
                      Used for order tracking
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        formData.phone.length === 10
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {formData.phone.length}/10
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Email Address{" "}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      Optional
                    </span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>
            </section>

            <div className="my-8 border-t border-gray-100" />

            <section>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-600">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Recipe Information
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Describe the recipe you want.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <label
                    htmlFor="recipeName"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Recipe Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    id="recipeName"
                    name="recipeName"
                    type="text"
                    value={formData.recipeName}
                    onChange={handleChange}
                    required
                    placeholder="Example: Special Chicken Curry"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Recipe Description{" "}
                    <span className="text-orange-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Describe exactly what you want, including ingredients, taste, preparation style, or any special requirements..."
                    className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="quantity"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Quantity <span className="text-orange-500">*</span>
                    </label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="unit"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Unit <span className="text-orange-500">*</span>
                    </label>
                    <select
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      required
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                    >
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="litre">Litre</option>
                      <option value="ml">Millilitre (ml)</option>
                      <option value="piece">Piece</option>
                      <option value="pieces">Pieces</option>
                      <option value="plate">Plate</option>
                      <option value="box">Box</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <div className="my-8 border-t border-gray-100" />

            <section>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-600">
                  3
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Delivery Information
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Tell us where and when you need it.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="deliveryDate"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Preferred Delivery Date{" "}
                      <span className="text-orange-500">*</span>
                    </label>
                    <input
                      id="deliveryDate"
                      name="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="deliveryTime"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Preferred Delivery Time{" "}
                      <span className="text-orange-500">*</span>
                    </label>
                    <input
                      id="deliveryTime"
                      name="deliveryTime"
                      type="time"
                      value={formData.deliveryTime}
                      onChange={handleChange}
                      required
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="deliveryAddress"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Complete Delivery Address{" "}
                    <span className="text-orange-500">*</span>
                  </label>
                  <textarea
                    id="deliveryAddress"
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleChange}
                    required
                    rows={5}
                    autoComplete="street-address"
                    placeholder="House/Flat No, Street, Area, City, State, PIN code"
                    className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mapPin"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Google Maps Location{" "}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      Optional
                    </span>
                  </label>
                  <input
                    id="mapPin"
                    name="mapPin"
                    type="url"
                    value={formData.mapPin}
                    onChange={handleChange}
                    placeholder="Paste your Google Maps location link"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    This helps our delivery team find your location easily.
                  </p>
                </div>
              </div>
            </section>

            <div className="my-8 border-t border-gray-100" />

            <section>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-600">
                  4
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Additional Instructions
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Add any special requirements.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <textarea
                  id="additionalInstructions"
                  name="additionalInstructions"
                  value={formData.additionalInstructions}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Spice level, packaging requirements, ingredients to avoid, special preparation instructions, etc."
                  className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </section>

            <div className="mt-9 border-t border-gray-100 pt-7">
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-13 w-full items-center justify-center rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting Request...
                  </>
                ) : (
                  "Submit Custom Recipe Request"
                )}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                After submission, you will receive one Track ID. Use your
                Track ID and phone number to track your request.
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
