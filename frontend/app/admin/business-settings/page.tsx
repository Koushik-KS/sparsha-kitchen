"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api";

type BusinessSettings = {
  phoneNumber: string;
  whatsappNumber: string;
  instagramUrl: string;
};

type BusinessSettingsResponse = {
  success: boolean;
  message?: string;
  settings?: BusinessSettings;
};

// ==========================================
// ICONS
// ==========================================

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 16.92v3a2 2 0 0 1-2.18 2
        19.79 19.79 0 0 1-8.63-3.07
        19.5 19.5 0 0 1-6-6
        A19.79 19.79 0 0 1 2.12 4.18
        2 2 0 0 1 4.11 2h3
        a2 2 0 0 1 2 1.72
        c.12.9.33 1.78.62 2.64
        a2 2 0 0 1-.45 2.11L8 9.73
        a16 16 0 0 0 6 6l1.26-1.26
        a2 2 0 0 1 2.11-.45
        c.86.29 1.74.5 2.64.62
        A2 2 0 0 1 22 16.92z"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .17 5.33.17 11.89c0 2.09.55 4.13 1.59 5.92L.07 24l6.34-1.66a11.88 11.88 0 0 0 5.64 1.44h.01c6.55 0 11.88-5.33 11.88-11.89 0-3.18-1.24-6.17-3.42-8.41ZM12.06 21.77h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.76.98 1-3.67-.23-.38a9.88 9.88 0 0 1-1.51-5.23c0-5.44 4.43-9.87 9.88-9.87 2.63 0 5.1 1.03 6.96 2.9a9.82 9.82 0 0 1 2.89 6.97c0 5.45-4.43 9.89-9.83 9.89Zm5.42-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.06 2.85 1.21 3.05c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.49 1.68.63.71.23 1.35.2 1.86.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
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
  );
}

export default function BusinessSettingsPage() {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getToken = useCallback(() => {
    return localStorage.getItem("adminToken");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    router.push("/admin/login");
  }, [router]);

  // ==========================================
  // LOAD BUSINESS SETTINGS
  // ==========================================

  const fetchBusinessSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/business-settings`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data: BusinessSettingsResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load business settings."
        );
      }

      setPhoneNumber(
        data.settings?.phoneNumber || ""
      );

      setWhatsappNumber(
        data.settings?.whatsappNumber || ""
      );

      setInstagramUrl(
        data.settings?.instagramUrl || ""
      );
    } catch (err) {
      console.error(
        "Fetch business settings error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load business settings."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, logout, router]);

  useEffect(() => {
    void fetchBusinessSettings();
  }, [fetchBusinessSettings]);

  // ==========================================
  // SAVE BUSINESS SETTINGS
  // ==========================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/business-settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phoneNumber: phoneNumber.trim(),
            whatsappNumber: whatsappNumber.trim(),
            instagramUrl: instagramUrl.trim(),
          }),
        }
      );

      const data: BusinessSettingsResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save business settings."
        );
      }

      setMessage(
        data.message ||
          "Business settings saved successfully."
      );

      if (data.settings) {
        setPhoneNumber(
          data.settings.phoneNumber || ""
        );

        setWhatsappNumber(
          data.settings.whatsappNumber || ""
        );

        setInstagramUrl(
          data.settings.instagramUrl || ""
        );
      }
    } catch (err) {
      console.error(
        "Save business settings error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save business settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-orange-50 text-zinc-900">

      {/* HEADER */}
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-5 lg:px-8">

          <div>
            <div className="text-2xl font-bold tracking-tight text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="text-xs font-medium text-zinc-500">
              Admin Panel
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={() =>
                router.push("/admin")
              }
              className="rounded-full border border-orange-200 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Recipes
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/customer-recipes"
                )
              }
              className="rounded-full border border-orange-200 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Customer Recipes
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/orders")
              }
              className="rounded-full border border-orange-200 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Orders
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/delivery-team"
                )
              }
              className="rounded-full border border-orange-200 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Delivery Team
            </button>

            <button
              type="button"
              className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Business Settings
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

      {/* CONTENT */}
      <section className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        <div>
          <p className="font-semibold uppercase tracking-wide text-orange-600">
            Business Settings
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Contact Details
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-600">
            Change your phone, WhatsApp, and Instagram
            details here. Changes are saved to MongoDB
            and will be used by the website.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {message && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {/* SETTINGS CARD */}
        <div className="mt-10 rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">

          {loading ? (
            <div className="py-12 text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />

              <p className="mt-5 text-zinc-600">
                Loading business settings...
              </p>

            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              {/* PHONE */}
              <div>

                <label
                  htmlFor="phoneNumber"
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <span className="text-orange-600">
                    <PhoneIcon />
                  </span>

                  <span>Phone Number</span>
                </label>

                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) =>
                    setPhoneNumber(
                      event.target.value
                    )
                  }
                  placeholder="Example: 9876543210"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />

                <p className="mt-2 text-xs text-zinc-500">
                  This number will be used for the
                  website call button.
                </p>

              </div>

              {/* WHATSAPP */}
              <div>

                <label
                  htmlFor="whatsappNumber"
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <span className="text-green-600">
                    <WhatsAppIcon />
                  </span>

                  <span>WhatsApp Number</span>
                </label>

                <input
                  id="whatsappNumber"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(event) =>
                    setWhatsappNumber(
                      event.target.value
                    )
                  }
                  placeholder="Example: 9876543210"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Enter the WhatsApp number with country
                  code if needed.
                </p>

              </div>

              {/* INSTAGRAM */}
              <div>

                <label
                  htmlFor="instagramUrl"
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <span className="text-pink-600">
                    <InstagramIcon />
                  </span>

                  <span>Instagram Account</span>
                </label>

                <input
                  id="instagramUrl"
                  type="url"
                  value={instagramUrl}
                  onChange={(event) =>
                    setInstagramUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://instagram.com/sparshakitchen"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Enter your complete Instagram profile
                  URL.
                </p>

              </div>

              {/* SAVE */}
              <div className="border-t border-zinc-100 pt-6">

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-orange-600 px-6 py-3.5 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>
          )}

        </div>
      </section>
    </main>
  );
}