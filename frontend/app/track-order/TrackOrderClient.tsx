"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_URL = "http://localhost:5000/api";

type OrderItem = {
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  isCustomRecipe?: boolean;
};

type StatusHistory = {
  status: string;
  changedAt: string;
  changedBy: string;
  note?: string;
};

type Order = {
  _id?: string;
  orderId: string;

  customer?: {
    name: string;
    phone: string;
    email?: string;
  };

  deliveryAddress?: string;
  mapPin?: string;

  requestedDeliveryDate?: string;
  requestedDeliveryTime?: string;

  additionalInstructions?: string;

  items?: OrderItem[];

  foodTotal?: number;
  deliveryCharge?: number;
  grandTotal?: number;

  deliveryPerson?: {
    name?: string;
    phone?: string;
    whatsapp?: string;
  } | null;

  status: string;

  customerConfirmed?: boolean;
  customerConfirmedAt?: string | null;

  adminConfirmed?: boolean;
  adminConfirmedAt?: string | null;

  changeRequested?: boolean;
  changeRequestMessage?: string;

  cancellationRequested?: boolean;
  cancellationRequestMessage?: string;

  statusHistory?: StatusHistory[];

  trackingToken?: string;

  createdAt?: string;
  updatedAt?: string;
};

type OrderResponse = {
  success: boolean;
  message?: string;
  order?: Order;
};

const statusLabels: Record<string, string> = {
  PENDING_CONFIRMATION: "Waiting for confirmation",
  CUSTOMER_CONFIRMED: "Customer confirmed",
  CONFIRMED: "Order confirmed",
  PREPARING: "Preparing your food",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusDescriptions: Record<string, string> = {
  PENDING_CONFIRMATION:
    "Your order request has been received and is waiting for confirmation.",

  CUSTOMER_CONFIRMED:
    "You have confirmed the order. Sparsha Kitchen will review it.",

  CONFIRMED:
    "Your order has been confirmed by Sparsha Kitchen.",

  PREPARING:
    "Your food is currently being prepared.",

  READY:
    "Your order is ready for delivery.",

  OUT_FOR_DELIVERY:
    "Your order is on the way.",

  DELIVERED:
    "Your order has been delivered successfully.",

  CANCELLED:
    "This order has been cancelled.",
};

const statusSteps = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const formatDate = (date?: string) => {
  if (!date) {
    return "Not specified";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (date?: string) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusLabel = (status: string) => {
  return statusLabels[status] || status.replaceAll("_", " ");
};

const getStatusIndex = (status: string) => {
  if (status === "CUSTOMER_CONFIRMED") {
    return 1;
  }

  return statusSteps.indexOf(status);
};

export default function TrackOrderClient() {
  const searchParams = useSearchParams();

  /*
   * Initialize Order ID directly from the URL.
   *
   * This avoids using useEffect + setState,
   * which was causing the ESLint error.
   */
  const [orderId, setOrderId] = useState(
    () => searchParams.get("orderId") || ""
  );

  const [phone, setPhone] = useState("");

  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [confirming, setConfirming] = useState(false);

  const [changeMessage, setChangeMessage] = useState("");
  const [requestingChange, setRequestingChange] =
    useState(false);

  const [cancellationMessage, setCancellationMessage] =
    useState("");

  const [
    requestingCancellation,
    setRequestingCancellation,
  ] = useState(false);

  const [actionMessage, setActionMessage] =
    useState("");

  // ==========================================
  // FETCH ORDER
  // ==========================================

  const fetchOrder = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      setError("");
      setActionMessage("");
      setOrder(null);

      const trimmedOrderId = orderId.trim();
      const trimmedPhone = phone.trim();

      if (!trimmedOrderId) {
        setError("Please enter your Order ID.");
        return;
      }

      if (!trimmedPhone) {
        setError(
          "Please enter the phone number used for the order."
        );
        return;
      }

      try {
        setLoading(true);

        const query = new URLSearchParams({
          orderId: trimmedOrderId,
          phone: trimmedPhone,
        });

        const response = await fetch(
          `${API_URL}/orders/track?${query.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: OrderResponse =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to find the order."
          );
        }

        if (!data.order) {
          throw new Error(
            "Order information was not returned."
          );
        }

        setOrder(data.order);
      } catch (err) {
        console.error(
          "Track order error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to find your order."
        );
      } finally {
        setLoading(false);
      }
    },
    [orderId, phone]
  );

  // ==========================================
  // CONFIRM ORDER
  // ==========================================

  const handleConfirmOrder = async () => {
    if (!order?.trackingToken) {
      setError(
        "Confirmation token is not available for this order."
      );
      return;
    }

    try {
      setConfirming(true);
      setError("");
      setActionMessage("");

      const response = await fetch(
        `${API_URL}/orders/confirm/${order.trackingToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data: OrderResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to confirm the order."
        );
      }

      setActionMessage(
        data.message ||
          "Order confirmed successfully."
      );

      if (data.order) {
        setOrder(data.order);
      } else {
        await fetchOrder();
      }
    } catch (err) {
      console.error(
        "Confirm order error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to confirm the order."
      );
    } finally {
      setConfirming(false);
    }
  };

  // ==========================================
  // CHANGE REQUEST
  // ==========================================

  const handleChangeRequest = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!order?.trackingToken) {
      setError(
        "Tracking token is not available for this order."
      );
      return;
    }

    if (!changeMessage.trim()) {
      setError(
        "Please enter what you would like to change."
      );
      return;
    }

    try {
      setRequestingChange(true);
      setError("");
      setActionMessage("");

      const response = await fetch(
        `${API_URL}/orders/change-request/${order.trackingToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: changeMessage.trim(),
          }),
        }
      );

      const data: OrderResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit the change request."
        );
      }

      setActionMessage(
        data.message ||
          "Your change request has been submitted."
      );

      setChangeMessage("");

      if (data.order) {
        setOrder(data.order);
      } else {
        await fetchOrder();
      }
    } catch (err) {
      console.error(
        "Change request error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit the change request."
      );
    } finally {
      setRequestingChange(false);
    }
  };

  // ==========================================
  // CANCELLATION REQUEST
  // ==========================================

  const handleCancellationRequest = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!order?.trackingToken) {
      setError(
        "Tracking token is not available for this order."
      );
      return;
    }

    if (!cancellationMessage.trim()) {
      setError(
        "Please enter a reason for cancellation."
      );
      return;
    }

    try {
      setRequestingCancellation(true);
      setError("");
      setActionMessage("");

      const response = await fetch(
        `${API_URL}/orders/cancel-request/${order.trackingToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message:
              cancellationMessage.trim(),
          }),
        }
      );

      const data: OrderResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit the cancellation request."
        );
      }

      setActionMessage(
        data.message ||
          "Your cancellation request has been submitted."
      );

      setCancellationMessage("");

      if (data.order) {
        setOrder(data.order);
      } else {
        await fetchOrder();
      }
    } catch (err) {
      console.error(
        "Cancellation request error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit the cancellation request."
      );
    } finally {
      setRequestingCancellation(false);
    }
  };

  // ==========================================
  // STATUS
  // ==========================================

  const currentStatusIndex = order
    ? getStatusIndex(order.status)
    : -1;

  const canConfirm =
    order?.status === "PENDING_CONFIRMATION" &&
    !order.customerConfirmed;

  const canRequestChange =
    !!order &&
    !["DELIVERED", "CANCELLED"].includes(
      order.status
    );

  const canRequestCancellation =
    !!order &&
    !["DELIVERED", "CANCELLED"].includes(
      order.status
    ) &&
    !order.cancellationRequested;

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-orange-50 text-zinc-900">
      {/* HEADER */}
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-orange-600"
          >
            Sparsha Kitchen
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
              className="font-medium text-zinc-700 hover:text-orange-600"
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
              className="font-medium text-orange-600"
            >
              Track Order
            </Link>
          </nav>

          <Link
            href="/recipes"
            className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Browse Recipes
          </Link>
        </div>
      </header>

      {/* PAGE */}
      <section className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold uppercase tracking-wide text-orange-600">
            Sparsha Kitchen
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Track Your Order
          </h1>

          <p className="mt-5 text-lg leading-8 text-zinc-600">
            Enter your Order ID and phone number to
            view the latest status of your order.
          </p>
        </div>

        {/* SEARCH FORM */}
        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-orange-100 bg-white p-7 shadow-sm sm:p-9">
          <form
            onSubmit={fetchOrder}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="orderId"
                className="block text-sm font-semibold text-zinc-800"
              >
                Order ID
              </label>

              <input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(event) =>
                  setOrderId(event.target.value)
                }
                placeholder="Example: SK-20260831-1234"
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-zinc-800"
              >
                Phone Number
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Phone number used for the order"
                autoComplete="tel"
                className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {actionMessage && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                {actionMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-orange-600 px-6 py-3.5 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Finding Order..."
                : "Track Order"}
            </button>
          </form>
        </div>

        {/* ORDER DETAILS */}
        {order && (
          <div className="mt-10 space-y-7">
            {/* ORDER HEADER */}
            <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm sm:p-9">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Order ID
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-orange-600">
                    {order.orderId}
                  </h2>

                  <p className="mt-2 text-sm text-zinc-500">
                    Placed{" "}
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div className="rounded-full bg-orange-100 px-4 py-2 text-center text-sm font-bold text-orange-700">
                  {getStatusLabel(order.status)}
                </div>
              </div>

              <div className="mt-7 rounded-2xl bg-orange-50 p-5">
                <p className="font-semibold text-zinc-900">
                  {statusDescriptions[
                    order.status
                  ] ||
                    "Your order status has been updated."}
                </p>
              </div>
            </div>

            {/* STATUS TIMELINE */}
            <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="text-2xl font-bold">
                Order Progress
              </h2>

              <div className="mt-7 space-y-5">
                {statusSteps.map(
                  (status, index) => {
                    const isCurrent =
                      order.status === status ||
                      (order.status ===
                        "CUSTOMER_CONFIRMED" &&
                        status ===
                          "CONFIRMED");

                    const isCompleted =
                      currentStatusIndex >=
                        index &&
                      currentStatusIndex >= 0;

                    const historyEntry =
                      order.statusHistory?.find(
                        (entry) =>
                          entry.status ===
                          status
                      );

                    return (
                      <div
                        key={status}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                              isCompleted
                                ? "bg-orange-600 text-white"
                                : "bg-zinc-100 text-zinc-400"
                            }`}
                          >
                            {isCompleted
                              ? "✓"
                              : index + 1}
                          </div>

                          {index <
                            statusSteps.length -
                              1 && (
                            <div
                              className={`mt-1 h-8 w-0.5 ${
                                currentStatusIndex >
                                index
                                  ? "bg-orange-500"
                                  : "bg-zinc-200"
                              }`}
                            />
                          )}
                        </div>

                        <div className="pb-4">
                          <p
                            className={`font-semibold ${
                              isCurrent
                                ? "text-orange-600"
                                : "text-zinc-800"
                            }`}
                          >
                            {getStatusLabel(
                              status
                            )}
                          </p>

                          {isCurrent && (
                            <p className="mt-1 text-sm text-zinc-500">
                              Current status
                            </p>
                          )}

                          {historyEntry && (
                            <p className="mt-1 text-xs text-zinc-400">
                              {formatDateTime(
                                historyEntry.changedAt
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}

                {order.status ===
                  "CANCELLED" && (
                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                      !
                    </div>

                    <div>
                      <p className="font-semibold text-red-600">
                        Order Cancelled
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        This order is no longer active.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CUSTOMER + DELIVERY */}
            <div className="grid gap-7 lg:grid-cols-2">
              <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold">
                  Customer Details
                </h2>

                <div className="mt-5 space-y-4 text-sm">
                  <div>
                    <p className="text-zinc-500">
                      Name
                    </p>

                    <p className="mt-1 font-semibold">
                      {order.customer?.name ||
                        "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">
                      Phone
                    </p>

                    <p className="mt-1 font-semibold">
                      {order.customer?.phone ||
                        "Not available"}
                    </p>
                  </div>

                  {order.customer?.email && (
                    <div>
                      <p className="text-zinc-500">
                        Email
                      </p>

                      <p className="mt-1 break-all font-semibold">
                        {order.customer.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold">
                  Delivery Details
                </h2>

                <div className="mt-5 space-y-4 text-sm">
                  <div>
                    <p className="text-zinc-500">
                      Delivery Date
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatDate(
                        order.requestedDeliveryDate
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">
                      Delivery Time
                    </p>

                    <p className="mt-1 font-semibold">
                      {order.requestedDeliveryTime ||
                        "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">
                      Address
                    </p>

                    <p className="mt-1 font-semibold leading-6">
                      {order.deliveryAddress ||
                        "Not available"}
                    </p>
                  </div>

                  {order.mapPin && (
                    <a
                      href={order.mapPin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-semibold text-orange-600 hover:text-orange-700"
                    >
                      Open Map Pin →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ORDER ITEMS */}
            <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="text-2xl font-bold">
                Order Items
              </h2>

              <div className="mt-6 divide-y divide-zinc-100">
                {order.items?.map(
                  (item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between gap-5 py-5"
                    >
                      <div>
                        <p className="font-semibold">
                          {item.name}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {item.quantity}{" "}
                          {item.unit} × ₹
                          {Number(
                            item.pricePerUnit
                          ).toFixed(2)}
                        </p>

                        {item.isCustomRecipe && (
                          <span className="mt-2 inline-block rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                            Custom Recipe
                          </span>
                        )}
                      </div>

                      <p className="font-bold">
                        ₹
                        {Number(
                          item.totalPrice
                        ).toFixed(2)}
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="mt-5 border-t border-zinc-200 pt-5">
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>Food Total</span>

                  <span>
                    ₹
                    {Number(
                      order.foodTotal || 0
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-zinc-600">
                  <span>
                    Delivery Charge
                  </span>

                  <span>
                    ₹
                    {Number(
                      order.deliveryCharge || 0
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4">
                  <span className="text-lg font-bold">
                    Grand Total
                  </span>

                  <span className="text-2xl font-bold text-orange-600">
                    ₹
                    {Number(
                      order.grandTotal || 0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* DELIVERY PERSON */}
            {order.deliveryPerson && (
              <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold">
                  Delivery Person
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-zinc-500">
                      Name
                    </p>

                    <p className="mt-1 font-semibold">
                      {order.deliveryPerson.name ||
                        "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      Phone
                    </p>

                    <p className="mt-1 font-semibold">
                      {order.deliveryPerson.phone ||
                        "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CONFIRM ORDER */}
            {canConfirm && (
              <div className="rounded-3xl border border-green-200 bg-green-50 p-7 shadow-sm">
                <h2 className="text-xl font-bold text-green-800">
                  Confirm Your Order
                </h2>

                <p className="mt-2 text-sm leading-6 text-green-700">
                  Please confirm that the order
                  details are correct.
                </p>

                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={confirming}
                  className="mt-5 rounded-full bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirming
                    ? "Confirming..."
                    : "Confirm Order"}
                </button>
              </div>
            )}

            {/* CUSTOMER CONFIRMED */}
            {order.customerConfirmed && (
              <div className="rounded-3xl border border-green-200 bg-green-50 p-7">
                <p className="font-bold text-green-800">
                  ✓ You have confirmed this order.
                </p>

                {order.customerConfirmedAt && (
                  <p className="mt-1 text-sm text-green-700">
                    Confirmed{" "}
                    {formatDateTime(
                      order.customerConfirmedAt
                    )}
                  </p>
                )}
              </div>
            )}

            {/* CHANGE REQUEST */}
            {canRequestChange && (
              <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold">
                  Request an Order Change
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Need to change something? Send
                  Sparsha Kitchen a message.
                </p>

                {order.changeRequested && (
                  <div className="mt-5 rounded-2xl bg-orange-50 p-4 text-sm">
                    <p className="font-semibold text-orange-700">
                      Change request already submitted.
                    </p>

                    {order.changeRequestMessage && (
                      <p className="mt-1 text-zinc-600">
                        {order.changeRequestMessage}
                      </p>
                    )}
                  </div>
                )}

                {!order.changeRequested && (
                  <form
                    onSubmit={handleChangeRequest}
                    className="mt-5"
                  >
                    <textarea
                      rows={4}
                      value={changeMessage}
                      onChange={(event) =>
                        setChangeMessage(
                          event.target.value
                        )
                      }
                      placeholder="Example: Please change the delivery time to 6 PM."
                      className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />

                    <button
                      type="submit"
                      disabled={requestingChange}
                      className="mt-4 rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {requestingChange
                        ? "Sending..."
                        : "Request Change"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* CANCELLATION REQUEST */}
            {canRequestCancellation && (
              <div className="rounded-3xl border border-red-100 bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold">
                  Request Cancellation
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  If you no longer need this order,
                  you can send a cancellation request.
                </p>

                <form
                  onSubmit={
                    handleCancellationRequest
                  }
                  className="mt-5"
                >
                  <textarea
                    rows={3}
                    value={cancellationMessage}
                    onChange={(event) =>
                      setCancellationMessage(
                        event.target.value
                      )
                    }
                    placeholder="Reason for cancellation"
                    className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />

                  <button
                    type="submit"
                    disabled={
                      requestingCancellation
                    }
                    className="mt-4 rounded-full border border-red-200 bg-red-50 px-6 py-3 font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {requestingCancellation
                      ? "Sending..."
                      : "Request Cancellation"}
                  </button>
                </form>
              </div>
            )}

            {/* CANCELLATION REQUEST STATUS */}
            {order.cancellationRequested &&
              order.status !== "CANCELLED" && (
                <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-7">
                  <p className="font-bold text-yellow-800">
                    Cancellation request submitted
                  </p>

                  {order.cancellationRequestMessage && (
                    <p className="mt-2 text-sm text-yellow-700">
                      {
                        order.cancellationRequestMessage
                      }
                    </p>
                  )}

                  <p className="mt-2 text-xs text-yellow-600">
                    Sparsha Kitchen will review your
                    request.
                  </p>
                </div>
              )}

            {/* INSTRUCTIONS */}
            {order.additionalInstructions && (
              <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold">
                  Additional Instructions
                </h2>

                <p className="mt-3 whitespace-pre-wrap leading-7 text-zinc-600">
                  {order.additionalInstructions}
                </p>
              </div>
            )}

            {/* FOOT ACTIONS */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/recipes"
                className="rounded-full bg-orange-600 px-7 py-3 text-center font-semibold text-white hover:bg-orange-700"
              >
                Browse Recipes
              </Link>

              <Link
                href="/custom-recipe"
                className="rounded-full border border-zinc-200 bg-white px-7 py-3 text-center font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Request Custom Recipe
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <div className="font-bold text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="text-zinc-500">
              Homemade food, prepared with care.
            </p>
          </div>

          <div className="flex gap-6">
            <Link
              href="/"
              className="text-zinc-600 hover:text-orange-600"
            >
              Home
            </Link>

            <Link
              href="/recipes"
              className="text-zinc-600 hover:text-orange-600"
            >
              Recipes
            </Link>

            <Link
              href="/track-order"
              className="text-orange-600"
            >
              Track Order
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}