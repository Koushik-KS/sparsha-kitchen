"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api";

type DeliveryPerson = {
  _id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type DeliveryPersonsResponse = {
  success: boolean;
  message?: string;
  deliveryPersons?: DeliveryPerson[];
};

type DeliveryPersonResponse = {
  success: boolean;
  message?: string;
  deliveryPerson?: DeliveryPerson;
};

export default function DeliveryTeamPage() {
  const router = useRouter();

  const [deliveryPersons, setDeliveryPersons] = useState<
    DeliveryPerson[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isActive, setIsActive] = useState(true);

  const getToken = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("adminToken");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    router.replace("/admin/login");
  }, [router]);

  const fetchDeliveryPersons = useCallback(async () => {
    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/delivery-persons`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data: DeliveryPersonsResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load delivery persons."
        );
      }

      setDeliveryPersons(data.deliveryPersons || []);
    } catch (err) {
      console.error(
        "Fetch delivery persons error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load delivery persons."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, logout, router]);

  useEffect(() => {
    void fetchDeliveryPersons();
  }, [fetchDeliveryPersons]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPhone("");
    setWhatsapp("");
    setIsActive(true);
  };

  const startEdit = (person: DeliveryPerson) => {
    setError("");
    setMessage("");

    setEditingId(person._id);
    setName(person.name || "");
    setPhone(person.phone || "");
    setWhatsapp(person.whatsapp || "");
    setIsActive(person.isActive !== false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter the delivery person name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter the phone number.");
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${API_URL}/admin/delivery-persons/${editingId}`
        : `${API_URL}/admin/delivery-persons`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          isActive,
        }),
      });

      const data: DeliveryPersonResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save delivery person."
        );
      }

      setMessage(
        data.message ||
          (editingId
            ? "Delivery person updated successfully."
            : "Delivery person added successfully.")
      );

      resetForm();
      await fetchDeliveryPersons();
    } catch (err) {
      console.error(
        "Save delivery person error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save delivery person."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // PERMANENT DELETE DELIVERY PERSON
  // ==========================================

  const permanentlyDeleteDeliveryPerson = async (
    person: DeliveryPerson
  ) => {
    const confirmed = window.confirm(
      `Delete ${person.name} permanently?\n\nThis will permanently remove this delivery person from the system. This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    const secondConfirmed = window.confirm(
      `Are you sure you want to permanently delete ${person.name}?`
    );

    if (!secondConfirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/admin/delivery-persons/${person._id}/permanent`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: DeliveryPersonResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete delivery person."
        );
      }

      setMessage(
        data.message ||
          "Delivery person deleted permanently."
      );

      if (editingId === person._id) {
        resetForm();
      }

      await fetchDeliveryPersons();
    } catch (err) {
      console.error(
        "Permanent delete delivery person error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete delivery person."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // ACTIVE / INACTIVE TOGGLE
  // ==========================================

  const toggleActive = async (
    person: DeliveryPerson
  ) => {
    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/admin/delivery-persons/${person._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: person.name,
            phone: person.phone,
            whatsapp: person.whatsapp || "",
            isActive: !person.isActive,
          }),
        }
      );

      const data: DeliveryPersonResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to change delivery person status."
        );
      }

      setMessage(
        data.message ||
          "Delivery person status updated."
      );

      await fetchDeliveryPersons();
    } catch (err) {
      console.error(
        "Toggle delivery person error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to change delivery person status."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-orange-50 text-zinc-900">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <div className="text-2xl font-bold tracking-tight text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="text-xs font-medium text-zinc-500">
              Admin Panel · Delivery Team
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Recipes
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/orders")
              }
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Orders
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="mb-8">
          <p className="font-semibold uppercase tracking-wide text-orange-600">
            Delivery Management
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Delivery Team
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-600">
            Add and manage delivery people. Active delivery
            people will appear in the order assignment dropdown.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <section className="h-fit rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  {editingId
                    ? "Edit Delivery Person"
                    : "Add Delivery Person"}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {editingId
                    ? "Update the delivery person's details."
                    : "Add a new person to your delivery team."}
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm font-semibold text-zinc-500 hover:text-zinc-900"
                >
                  Cancel
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="delivery-name"
                  className="block text-sm font-semibold"
                >
                  Name
                </label>

                <input
                  id="delivery-name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Ravi Kumar"
                  className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="delivery-phone"
                  className="block text-sm font-semibold"
                >
                  Phone
                </label>

                <input
                  id="delivery-phone"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="9876543210"
                  inputMode="tel"
                  className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="delivery-whatsapp"
                  className="block text-sm font-semibold"
                >
                  WhatsApp
                </label>

                <input
                  id="delivery-whatsapp"
                  value={whatsapp}
                  onChange={(event) =>
                    setWhatsapp(event.target.value)
                  }
                  placeholder="9876543210"
                  inputMode="tel"
                  className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-zinc-50 p-4">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) =>
                    setIsActive(event.target.checked)
                  }
                  className="h-4 w-4"
                />

                <span>
                  <span className="block text-sm font-semibold">
                    Active delivery person
                  </span>

                  <span className="mt-1 block text-xs text-zinc-500">
                    Active people can be assigned to orders.
                  </span>
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Delivery Person"
                    : "Add Delivery Person"}
              </button>
            </form>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  Delivery People
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {deliveryPersons.length}{" "}
                  {deliveryPersons.length === 1
                    ? "person"
                    : "people"}{" "}
                  in the system
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void fetchDeliveryPersons()
                }
                disabled={loading}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center text-sm text-zinc-500">
                Loading delivery team...
              </div>
            ) : deliveryPersons.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-orange-200 bg-white p-10 text-center">
                <h3 className="text-lg font-bold">
                  No delivery people yet
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  Use the form to add your first delivery person.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveryPersons.map((person) => (
                  <article
                    key={person._id}
                    className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold">
                            {person.name}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              person.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {person.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-zinc-600">
                          Phone: {person.phone}
                        </p>

                        {person.whatsapp && (
                          <p className="mt-1 text-sm text-zinc-600">
                            WhatsApp: {person.whatsapp}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* EDIT */}
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(person)
                          }
                          disabled={saving}
                          className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                        >
                          Edit
                        </button>

                        {/* ACTIVE / INACTIVE */}
                        <button
                          type="button"
                          onClick={() =>
                            void toggleActive(person)
                          }
                          disabled={saving}
                          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                        >
                          {person.isActive
                            ? "Set Inactive"
                            : "Set Active"}
                        </button>

                        {/* PERMANENT DELETE */}
                        <button
                          type="button"
                          onClick={() =>
                            void permanentlyDeleteDeliveryPerson(
                              person
                            )
                          }
                          disabled={saving}
                          className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}