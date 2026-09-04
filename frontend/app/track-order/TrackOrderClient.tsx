"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
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

  paymentStatus?: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  paidAmount?: number;
  remainingAmount?: number;

  paymentHistory?: {
    amount: number;
    method: string;
    recordedAt?: string;
    recordedBy?: string;
    note?: string;
  }[];

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

  deliveryOtp?: string | null;
  deliveryOtpVerified?: boolean;
  deliveryOtpExpiresAt?: string | null;

  statusHistory?: StatusHistory[];

  trackingToken?: string;
  confirmationToken?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

type OrderResponse = {
  success: boolean;
  message?: string;
  order?: Order;
};

// ==========================================
// STATUS LABELS
// ==========================================

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

// ==========================================
// STATUS DESCRIPTIONS
// ==========================================

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

// ==========================================
// STATUS STEPS
// ==========================================

const statusSteps = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (date?: string) => {
  if (!date) return "Not specified";

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

// ==========================================
// FORMAT DATE TIME
// ==========================================

const formatDateTime = (date?: string) => {
  if (!date) return "";

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

// ==========================================
// STATUS LABEL
// ==========================================

const getStatusLabel = (status: string) =>
  statusLabels[status] || status.replaceAll("_", " ");

// ==========================================
// STATUS INDEX
// ==========================================

const getStatusIndex = (status: string) => {
  if (status === "CUSTOMER_CONFIRMED") return 1;

  return statusSteps.indexOf(status);
};

// ==========================================
// PAYMENT STATUS LABEL
// ==========================================

const getPaymentStatusLabel = (
  status?: string
) => {
  if (status === "PAID") return "Paid";

  if (status === "PARTIALLY_PAID") {
    return "Partially Paid";
  }

  return "Unpaid";
};

// ==========================================
// PAYMENT STATUS CLASS
// ==========================================

const getPaymentStatusClass = (
  status?: string
) => {
  if (status === "PAID") {
    return "bg-green-100 text-green-700";
  }

  if (status === "PARTIALLY_PAID") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-red-100 text-red-700";
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function TrackOrderClient() {
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState(
    () => searchParams.get("orderId") || ""
  );

  const [phone, setPhone] = useState("");

  // ==========================================
  // FORGOT ORDER ID RECOVERY
  // ==========================================

  const [recoveryMode, setRecoveryMode] =
    useState(false);

  const [recoveryStep, setRecoveryStep] =
    useState<"PHONE" | "OTP" | "ORDERS">(
      "PHONE"
    );

  const [recoveryPhone, setRecoveryPhone] =
    useState("");

  const [recoveryOtp, setRecoveryOtp] =
    useState("");

  const [recoveryOrders, setRecoveryOrders] =
    useState<
      {
        orderId: string;
        customerName: string;
        status: string;
        grandTotal: number;
        paidAmount: number;
        paymentStatus: string;
        requestedDeliveryDate?: string;
        requestedDeliveryTime?: string;
        createdAt?: string;
      }[]
    >([]);

  const [recoveryLoading, setRecoveryLoading] =
    useState(false);

  const [recoveryError, setRecoveryError] =
    useState("");

  const [recoveryMessage, setRecoveryMessage] =
    useState("");

  const [recoveryDevOtp, setRecoveryDevOtp] =
    useState("");

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [confirming, setConfirming] =
    useState(false);

  const [changeMessage, setChangeMessage] =
    useState("");

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
    async (
      event?: FormEvent<HTMLFormElement>
    ) => {
      event?.preventDefault();

      setError("");
      setActionMessage("");
      setOrder(null);

      const trimmedOrderId =
        orderId.trim();

      const trimmedPhone =
        phone.trim();

      if (!trimmedOrderId) {
        setError(
          "Please enter your Order ID."
        );
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

        const query =
          new URLSearchParams({
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

        if (
          !response.ok ||
          !data.success
        ) {
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
  // FORGOT ORDER ID: REQUEST OTP
  // ==========================================

  const requestRecoveryOtp = async (
    event?: FormEvent<HTMLFormElement>
  ) => {
    event?.preventDefault();

    setRecoveryError("");
    setRecoveryMessage("");
    setRecoveryDevOtp("");

    const trimmedPhone =
      recoveryPhone.trim();

    if (!trimmedPhone) {
      setRecoveryError(
        "Please enter the phone number used for the order."
      );
      return;
    }

    try {
      setRecoveryLoading(true);

      const response = await fetch(
        `${API_URL}/orders/recover/request`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            phone: trimmedPhone,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to send recovery OTP."
        );
      }

      setRecoveryStep("OTP");

      setRecoveryMessage(
        "OTP generated successfully. Enter the 6-digit OTP."
      );

      if (data.otp) {
        setRecoveryDevOtp(
          String(data.otp)
        );
      }
    } catch (err) {
      console.error(
        "Order ID recovery request error:",
        err
      );

      setRecoveryError(
        err instanceof Error
          ? err.message
          : "Unable to send recovery OTP."
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  // ==========================================
  // FORGOT ORDER ID: VERIFY OTP
  // ==========================================

  const verifyRecoveryOtp = async (
    event?: FormEvent<HTMLFormElement>
  ) => {
    event?.preventDefault();

    setRecoveryError("");
    setRecoveryMessage("");

    const trimmedPhone =
      recoveryPhone.trim();

    const trimmedOtp =
      recoveryOtp.trim();

    if (!trimmedPhone) {
      setRecoveryError(
        "Phone number is required."
      );
      return;
    }

    if (!/^\d{6}$/.test(trimmedOtp)) {
      setRecoveryError(
        "Please enter a valid 6-digit OTP."
      );
      return;
    }

    try {
      setRecoveryLoading(true);

      const response = await fetch(
        `${API_URL}/orders/recover/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            phone: trimmedPhone,
            otp: trimmedOtp,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to verify OTP."
        );
      }

      setRecoveryOrders(
        Array.isArray(data.orders)
          ? data.orders
          : []
      );

      setRecoveryStep("ORDERS");

      setRecoveryMessage(
        "OTP verified. Your orders are listed below."
      );

      setRecoveryDevOtp("");
    } catch (err) {
      console.error(
        "Order ID recovery verification error:",
        err
      );

      setRecoveryError(
        err instanceof Error
          ? err.message
          : "Unable to verify OTP."
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  // ==========================================
  // FORGOT ORDER ID: SELECT ORDER
  // ==========================================

  const selectRecoveredOrder = async (
    selectedOrderId: string
  ) => {
    setOrderId(selectedOrderId);
    setPhone(recoveryPhone);
    setRecoveryMode(false);
    setRecoveryError("");
    setRecoveryMessage("");

    try {
      setLoading(true);
      setError("");
      setActionMessage("");
      setOrder(null);

      const query =
        new URLSearchParams({
          orderId: selectedOrderId,
          phone: recoveryPhone.trim(),
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

      if (
        !response.ok ||
        !data.success ||
        !data.order
      ) {
        throw new Error(
          data.message ||
            "Unable to load the selected order."
        );
      }

      setOrder(data.order);
    } catch (err) {
      console.error(
        "Load recovered order error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the selected order."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLOSE RECOVERY
  // ==========================================

  const closeRecovery = () => {
    setRecoveryMode(false);
    setRecoveryStep("PHONE");
    setRecoveryOtp("");
    setRecoveryOrders([]);
    setRecoveryError("");
    setRecoveryMessage("");
    setRecoveryDevOtp("");
  };

  // ==========================================
  // LIVE ORDER REFRESH
  // ==========================================

  const refreshOrder = useCallback(async () => {
    const trimmedOrderId = orderId.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedOrderId || !trimmedPhone) {
      return;
    }

    try {
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

      if (
        !response.ok ||
        !data.success ||
        !data.order
      ) {
        return;
      }

      setOrder(data.order);
    } catch (error) {
      console.error(
        "Live order refresh error:",
        error
      );
    }
  }, [orderId, phone]);

  // ==========================================
  // AUTO REFRESH EVERY 5 SECONDS
  // ==========================================

  useEffect(() => {
    if (!order) {
      return;
    }

    if (
      order.status === "DELIVERED" ||
      order.status === "CANCELLED"
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {
        refreshOrder();
      }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [order, refreshOrder]);

  // ==========================================
  // CONFIRM ORDER
  // ==========================================

  const handleConfirmOrder =
    async () => {
      if (!order?.confirmationToken) {
        setError(
          "Confirmation token is not available for this order. Please refresh the order and try again."
        );
        return;
      }

      try {
        setConfirming(true);
        setError("");
        setActionMessage("");

        const response = await fetch(
          `${API_URL}/orders/confirm/${order.confirmationToken}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

        const data: OrderResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to confirm the order."
          );
        }

        setActionMessage(
          data.message ||
            "Order confirmed successfully."
        );

        const returnedOrder =
          data.order;

        if (returnedOrder) {
          setOrder(
            (previousOrder) => {
              if (!previousOrder) {
                return returnedOrder;
              }

              return {
                ...previousOrder,
                ...returnedOrder,

                customer:
                  returnedOrder.customer ||
                  previousOrder.customer,

                items:
                  returnedOrder.items ||
                  previousOrder.items,

                deliveryPerson:
                  returnedOrder.deliveryPerson ??
                  previousOrder.deliveryPerson,

                statusHistory:
                  returnedOrder.statusHistory ||
                  previousOrder.statusHistory,

                trackingToken:
                  returnedOrder.trackingToken ||
                  previousOrder.trackingToken,

                confirmationToken:
                  returnedOrder.confirmationToken ??
                  null,

                deliveryAddress:
                  returnedOrder.deliveryAddress ||
                  previousOrder.deliveryAddress,

                mapPin:
                  returnedOrder.mapPin ||
                  previousOrder.mapPin,

                requestedDeliveryDate:
                  returnedOrder.requestedDeliveryDate ||
                  previousOrder.requestedDeliveryDate,

                requestedDeliveryTime:
                  returnedOrder.requestedDeliveryTime ||
                  previousOrder.requestedDeliveryTime,

                paymentStatus:
                  returnedOrder.paymentStatus ||
                  previousOrder.paymentStatus,

                paidAmount:
                  returnedOrder.paidAmount ??
                  previousOrder.paidAmount,
              };
            }
          );
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

  const handleChangeRequest =
    async (
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
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message:
                changeMessage.trim(),
            }),
          }
        );

        const data: OrderResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
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
          setOrder(
            (previousOrder) =>
              previousOrder
                ? {
                    ...previousOrder,
                    ...data.order,
                  }
                : data.order || null
          );
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

  const handleCancellationRequest =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!order?.trackingToken) {
        setError(
          "Tracking token is not available for this order."
        );
        return;
      }

      if (
        !cancellationMessage.trim()
      ) {
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
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message:
                cancellationMessage.trim(),
            }),
          }
        );

        const data: OrderResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
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
          setOrder(
            (previousOrder) =>
              previousOrder
                ? {
                    ...previousOrder,
                    ...data.order,
                  }
                : data.order || null
          );
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

  const currentStatusIndex =
    order
      ? getStatusIndex(order.status)
      : -1;

  // ==========================================
  // ACTION PERMISSIONS
  // ==========================================

  const canConfirm =
    order?.status ===
      "PENDING_CONFIRMATION" &&
    !order.customerConfirmed &&
    !!order.confirmationToken;

  const canRequestChange =
    !!order &&
    ![
      "DELIVERED",
      "CANCELLED",
      "OUT_FOR_DELIVERY",
    ].includes(order.status);

  const canRequestCancellation =
    !!order &&
    ![
      "DELIVERED",
      "CANCELLED",
      "OUT_FOR_DELIVERY",
    ].includes(order.status) &&
    !order.cancellationRequested;

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-orange-50 text-zinc-900">
      {/* ========================================
          HEADER
      ======================================== */}

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
              className="font-medium text-orange-600"
            >
              Track Order
            </Link>
          </nav>

          <Link
            href="/recipes"
            className="shrink-0 rounded-full bg-orange-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700 sm:px-5 sm:text-sm"
          >
            <span className="sm:hidden">
              Recipes
            </span>

            <span className="hidden sm:inline">
              Browse Recipes
            </span>
          </Link>
        </div>
      </header>

      {/* ========================================
          PAGE
      ======================================== */}

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Sparsha Kitchen
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Track Your Order
          </h1>

          <p className="mt-4 text-sm leading-6 text-zinc-600 sm:mt-5 sm:text-lg sm:leading-8">
            Enter your Order ID and phone number to view
            the latest status of your order.
          </p>
        </div>

        {/* ========================================
            SEARCH FORM
        ======================================== */}

        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:mt-10 sm:rounded-3xl sm:p-9">
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
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
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
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  )
                }
                placeholder="Phone number used for the order"
                autoComplete="tel"
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
              />
            </div>

            {error && (
              <div className="break-words rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-700">
                {error}
              </div>
            )}

            {actionMessage && (
              <div className="break-words rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium leading-6 text-green-700">
                {actionMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-orange-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              {loading
                ? "Finding Order..."
                : "Track Order"}
            </button>
          </form>

          {/* ========================================
              FORGOT ORDER ID
          ======================================== */}

          {!recoveryMode && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setRecoveryMode(true);
                  setRecoveryStep("PHONE");
                  setRecoveryPhone(phone);
                  setRecoveryError("");
                  setRecoveryMessage("");
                  setRecoveryOtp("");
                  setRecoveryOrders([]);
                  setRecoveryDevOtp("");
                }}
                className="text-sm font-semibold text-orange-600 transition hover:text-orange-700 hover:underline"
              >
                Forgot Order ID?
              </button>
            </div>
          )}

          {recoveryMode && (
            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:mt-7 sm:rounded-3xl sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-600 sm:text-sm">
                    Order ID Recovery
                  </p>

                  <h2 className="mt-1 break-words text-lg font-bold text-zinc-900 sm:text-xl">
                    Recover Your Order ID
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Verify the phone number used for your
                    order to find your Order ID.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRecovery}
                  className="shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold text-zinc-500 transition hover:bg-white hover:text-zinc-800"
                >
                  Close
                </button>
              </div>

              {/* RECOVERY PHONE */}
              {recoveryStep === "PHONE" && (
                <form
                  onSubmit={requestRecoveryOtp}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="recoveryPhone"
                      className="block text-sm font-semibold text-zinc-800"
                    >
                      Phone Number
                    </label>

                    <input
                      id="recoveryPhone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={recoveryPhone}
                      onChange={(event) =>
                        setRecoveryPhone(
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10)
                        )
                      }
                      placeholder="Phone number used for the order"
                      autoComplete="tel"
                      className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                    />
                  </div>

                  {recoveryError && (
                    <div className="break-words rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-700">
                      {recoveryError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="w-full rounded-full bg-orange-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                  >
                    {recoveryLoading
                      ? "Sending OTP..."
                      : "Send OTP"}
                  </button>
                </form>
              )}

              {/* RECOVERY OTP */}
              {recoveryStep === "OTP" && (
                <form
                  onSubmit={verifyRecoveryOtp}
                  className="mt-6 space-y-4"
                >
                  <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-zinc-600">
                    OTP sent for{" "}
                    <span className="font-bold text-zinc-900">
                      {recoveryPhone}
                    </span>
                  </div>

                  {recoveryMessage && (
                    <div className="break-words rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium leading-6 text-green-700">
                      {recoveryMessage}
                    </div>
                  )}

                  {recoveryDevOtp && (
                    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
                      <p className="font-bold">
                        Development OTP
                      </p>

                      <p className="mt-1 text-2xl font-bold tracking-widest">
                        {recoveryDevOtp}
                      </p>

                      <p className="mt-1 text-xs">
                        This is shown only because WhatsApp
                        OTP integration is not configured yet.
                      </p>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="recoveryOtp"
                      className="block text-sm font-semibold text-zinc-800"
                    >
                      6-Digit OTP
                    </label>

                    <input
                      id="recoveryOtp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={recoveryOtp}
                      onChange={(event) =>
                        setRecoveryOtp(
                          event.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      placeholder="Enter OTP"
                      autoComplete="one-time-code"
                      className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-center text-lg font-bold tracking-[0.25em] outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-xl sm:tracking-[0.35em]"
                    />
                  </div>

                  {recoveryError && (
                    <div className="break-words rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-700">
                      {recoveryError}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="w-full rounded-full bg-orange-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 sm:text-base"
                    >
                      {recoveryLoading
                        ? "Verifying..."
                        : "Verify OTP"}
                    </button>

                    <button
                      type="button"
                      disabled={recoveryLoading}
                      onClick={() => {
                        setRecoveryStep("PHONE");
                        setRecoveryOtp("");
                        setRecoveryError("");
                        setRecoveryMessage("");
                        setRecoveryDevOtp("");
                      }}
                      className="w-full rounded-full border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 sm:flex-1 sm:text-base"
                    >
                      Change Phone
                    </button>
                  </div>
                </form>
              )}

              {/* RECOVERED ORDERS */}
              {recoveryStep === "ORDERS" && (
                <div className="mt-6">
                  {recoveryMessage && (
                    <div className="break-words rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium leading-6 text-green-700">
                      {recoveryMessage}
                    </div>
                  )}

                  {recoveryOrders.length === 0 ? (
                    <div className="mt-4 rounded-2xl bg-white p-5 text-sm leading-6 text-zinc-600">
                      No orders were found.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {recoveryOrders.map(
                        (recoveredOrder) => (
                          <button
                            key={
                              recoveredOrder.orderId
                            }
                            type="button"
                            onClick={() =>
                              selectRecoveredOrder(
                                recoveredOrder.orderId
                              )
                            }
                            className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-orange-400 hover:shadow-sm sm:p-5"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-zinc-500">
                                  Order ID
                                </p>

                                <p className="mt-1 break-all text-base font-bold text-orange-600 sm:text-lg">
                                  {
                                    recoveredOrder.orderId
                                  }
                                </p>

                                <p className="mt-1 break-words text-sm text-zinc-500">
                                  {
                                    recoveredOrder.customerName
                                  }
                                </p>
                              </div>

                              <div className="text-left sm:shrink-0 sm:text-right">
                                <p className="break-words text-sm font-semibold text-zinc-800">
                                  {getStatusLabel(
                                    recoveredOrder.status
                                  )}
                                </p>

                                <p className="mt-1 text-sm text-zinc-500">
                                  ₹
                                  {Number(
                                    recoveredOrder.grandTotal ||
                                      0
                                  ).toFixed(2)}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-orange-600">
                                  View Order →
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryStep("PHONE");
                      setRecoveryOtp("");
                      setRecoveryOrders([]);
                      setRecoveryError("");
                      setRecoveryMessage("");
                      setRecoveryDevOtp("");
                    }}
                    className="mt-5 w-full rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto"
                  >
                    Search Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================
            ORDER
        ======================================== */}

        {order && (
          <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-7">
            {/* ORDER HEADER */}

            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-9">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-500">
                    Order ID
                  </p>

                  <h2 className="mt-1 break-all text-xl font-bold text-orange-600 sm:text-2xl">
                    {order.orderId}
                  </h2>

                  <p className="mt-2 text-xs text-zinc-500 sm:text-sm">
                    Placed{" "}
                    {formatDateTime(
                      order.createdAt
                    )}
                  </p>
                </div>

                <div className="w-fit max-w-full rounded-full bg-orange-100 px-3 py-2 text-center text-xs font-bold text-orange-700 sm:px-4 sm:text-sm">
                  {getStatusLabel(
                    order.status
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-orange-50 p-4 sm:mt-7 sm:p-5">
                <p className="break-words text-sm font-semibold leading-6 text-zinc-900 sm:text-base">
                  {statusDescriptions[
                    order.status
                  ] ||
                    "Your order status has been updated."}
                </p>
              </div>
            </div>

            {/* DELIVERY OTP */}

            {order.status ===
              "OUT_FOR_DELIVERY" &&
              order.deliveryOtp &&
              !order.deliveryOtpVerified && (
                <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-5 shadow-sm sm:rounded-3xl sm:p-9">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-orange-600 sm:text-sm">
                      Delivery OTP
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-zinc-900 sm:text-2xl">
                      Your delivery verification code
                    </h2>

                    <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-white px-4 py-6 shadow-sm sm:mt-6 sm:px-6 sm:py-7">
                      <p className="break-all text-4xl font-black tracking-[0.2em] text-orange-600 sm:text-5xl sm:tracking-[0.35em]">
                        {order.deliveryOtp}
                      </p>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-zinc-600 sm:mt-5">
                      Give this 6-digit OTP to the delivery
                      person after receiving your order.
                    </p>

                    {order.deliveryOtpExpiresAt && (
                      <p className="mt-2 text-xs text-zinc-500">
                        OTP valid until{" "}
                        {formatDateTime(
                          order.deliveryOtpExpiresAt
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

            {/* OTP VERIFIED */}

            {order.deliveryOtpVerified && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm sm:rounded-3xl sm:p-7">
                <p className="font-bold text-green-800">
                  ✓ Delivery OTP verified
                </p>

                <p className="mt-1 text-sm leading-6 text-green-700">
                  Your delivery verification has been
                  completed.
                </p>

                {order.status ===
                  "DELIVERED" && (
                  <p className="mt-2 text-sm font-semibold leading-6 text-green-700">
                    Your order has been delivered successfully.
                  </p>
                )}
              </div>
            )}

            {/* ORDER PROGRESS */}

            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-9">
              <h2 className="text-xl font-bold sm:text-2xl">
                Order Progress
              </h2>

              <div className="mt-6 space-y-5 sm:mt-7">
                {statusSteps.map(
                  (status, index) => {
                    const isCurrent =
                      order.status ===
                        status ||
                      (order.status ===
                        "CUSTOMER_CONFIRMED" &&
                        status ===
                          "CONFIRMED");

                    const isCompleted =
                      currentStatusIndex >=
                        index &&
                      currentStatusIndex >=
                        0;

                    const historyEntry =
                      order.statusHistory?.find(
                        (entry) =>
                          entry.status ===
                          status
                      );

                    return (
                      <div
                        key={status}
                        className="flex gap-3 sm:gap-4"
                      >
                        <div className="flex shrink-0 flex-col items-center">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm ${
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

                        <div className="min-w-0 pb-4">
                          <p
                            className={`break-words font-semibold ${
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
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white sm:h-9 sm:w-9">
                      !
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-red-600">
                        Order Cancelled
                      </p>

                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        This order is no longer active.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CUSTOMER + DELIVERY DETAILS */}

            <div className="grid gap-5 sm:gap-7 lg:grid-cols-2">
              {/* CUSTOMER */}

              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">
                <h2 className="text-lg font-bold sm:text-xl">
                  Customer Details
                </h2>

                <div className="mt-5 space-y-4 text-sm">
                  <div>
                    <p className="text-zinc-500">
                      Name
                    </p>

                    <p className="mt-1 break-words font-semibold">
                      {order.customer?.name ||
                        "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">
                      Phone
                    </p>

                    <p className="mt-1 break-all font-semibold">
                      {order.customer?.phone ||
                        "Not available"}
                    </p>
                  </div>

                  {order.customer
                    ?.email && (
                    <div>
                      <p className="text-zinc-500">
                        Email
                      </p>

                      <p className="mt-1 break-all font-semibold">
                        {
                          order.customer
                            .email
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* DELIVERY */}

              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">
                <h2 className="text-lg font-bold sm:text-xl">
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
                      Delivery Address
                    </p>

                    <p className="mt-1 whitespace-pre-wrap break-words font-semibold leading-6">
                      {order.deliveryAddress ||
                        "Not available"}
                    </p>
                  </div>

                  {order.mapPin && (
                    <a
                      href={order.mapPin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full break-all font-semibold text-orange-600 hover:text-orange-700"
                    >
                      Open Map Pin →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* PAYMENT SUMMARY */}

            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-9">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold sm:text-2xl">
                  Payment Summary
                </h2>

                <span
                  className={`inline-flex w-fit rounded-full px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm ${getPaymentStatusClass(
                    order.paymentStatus
                  )}`}
                >
                  {getPaymentStatusLabel(
                    order.paymentStatus
                  )}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm text-zinc-600">
                  <span>
                    Order Total
                  </span>

                  <span className="shrink-0 font-semibold text-zinc-900">
                    ₹
                    {Number(
                      order.grandTotal || 0
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm text-zinc-600">
                  <span>
                    Amount Paid
                  </span>

                  <span className="shrink-0 font-semibold text-green-700">
                    ₹
                    {Number(
                      order.paidAmount || 0
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
                  <span className="font-bold">
                    Remaining Amount
                  </span>

                  <span
                    className={`shrink-0 text-lg font-bold sm:text-xl ${
                      Number(
                        order.remainingAmount ??
                          Number(
                            order.grandTotal ||
                              0
                          ) -
                            Number(
                              order.paidAmount ||
                                0
                            )
                      ) > 0
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    ₹
                    {Number(
                      order.remainingAmount ??
                        Number(
                          order.grandTotal ||
                            0
                        ) -
                          Number(
                            order.paidAmount ||
                              0
                          )
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* PAYMENT HISTORY */}

              {order.paymentHistory &&
                order.paymentHistory.length >
                  0 && (
                  <div className="mt-7 border-t border-zinc-200 pt-6">
                    <h3 className="font-bold">
                      Payment History
                    </h3>

                    <div className="mt-4 divide-y divide-zinc-100">
                      {order.paymentHistory.map(
                        (
                          payment,
                          index
                        ) => (
                          <div
                            key={`${payment.recordedAt}-${index}`}
                            className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-semibold">
                                ₹
                                {Number(
                                  payment.amount
                                ).toFixed(
                                  2
                                )}
                              </p>

                              <p className="text-sm text-zinc-500">
                                {
                                  payment.method
                                }
                              </p>
                            </div>

                            <div className="text-sm text-zinc-500 sm:text-right">
                              {payment.recordedAt && (
                                <p>
                                  {formatDateTime(
                                    payment.recordedAt
                                  )}
                                </p>
                              )}

                              {payment.note && (
                                <p className="mt-1 break-words">
                                  {
                                    payment.note
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* ORDER ITEMS */}

            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-9">
              <h2 className="text-xl font-bold sm:text-2xl">
                Order Items
              </h2>

              <div className="mt-6 divide-y divide-zinc-100">
                {order.items?.map(
                  (item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-start justify-between gap-4 py-5"
                    >
                      <div className="min-w-0">
                        <p className="break-words font-semibold">
                          {item.name}
                        </p>

                        <p className="mt-1 break-words text-sm text-zinc-500">
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

                      <p className="shrink-0 font-bold">
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
                <div className="flex items-center justify-between gap-4 text-sm text-zinc-600">
                  <span>
                    Food Total
                  </span>

                  <span className="shrink-0">
                    ₹
                    {Number(
                      order.foodTotal || 0
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-zinc-600">
                  <span>
                    Delivery Charge
                  </span>

                  <span className="shrink-0">
                    ₹
                    {Number(
                      order.deliveryCharge ||
                        0
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
                  <span className="text-base font-bold sm:text-lg">
                    Grand Total
                  </span>

                  <span className="shrink-0 text-xl font-bold text-orange-600 sm:text-2xl">
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
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">
                <h2 className="text-lg font-bold sm:text-xl">
                  Delivery Person
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-zinc-500">
                      Name
                    </p>

                    <p className="mt-1 break-words font-semibold">
                      {order.deliveryPerson
                        .name ||
                        "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      Phone
                    </p>

                    <p className="mt-1 break-all font-semibold">
                      {order.deliveryPerson
                        .phone ||
                        "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CONFIRM ORDER */}

            {canConfirm && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm sm:rounded-3xl sm:p-7">
                <h2 className="text-lg font-bold text-green-800 sm:text-xl">
                  Confirm Your Order
                </h2>

                <p className="mt-2 text-sm leading-6 text-green-700">
                  Please confirm that the order details
                  are correct.
                </p>

                <button
                  type="button"
                  onClick={
                    handleConfirmOrder
                  }
                  disabled={confirming}
                  className="mt-5 w-full rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-base"
                >
                  {confirming
                    ? "Confirming..."
                    : "Confirm Order"}
                </button>
              </div>
            )}

            {/* CUSTOMER CONFIRMED */}

            {order.customerConfirmed && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 sm:rounded-3xl sm:p-7">
                <p className="font-bold text-green-800">
                  ✓ You have confirmed this order.
                </p>

                {order.customerConfirmedAt && (
                  <p className="mt-1 text-sm leading-6 text-green-700">
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
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">
                <h2 className="text-lg font-bold sm:text-xl">
                  Request an Order Change
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Need to change something? Send Sparsha
                  Kitchen a message.
                </p>

                {order.changeRequested && (
                  <div className="mt-5 rounded-2xl bg-orange-50 p-4 text-sm leading-6">
                    <p className="font-semibold text-orange-700">
                      Change request already submitted.
                    </p>

                    {order.changeRequestMessage && (
                      <p className="mt-1 break-words text-zinc-600">
                        {
                          order.changeRequestMessage
                        }
                      </p>
                    )}
                  </div>
                )}

                {!order.changeRequested && (
                  <form
                    onSubmit={
                      handleChangeRequest
                    }
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
                      className="w-full resize-none rounded-xl border border-zinc-300 px-3 py-3 text-sm leading-6 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:px-4 sm:text-base"
                    />

                    <button
                      type="submit"
                      disabled={
                        requestingChange
                      }
                      className="mt-4 w-full rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-base"
                    >
                      {requestingChange
                        ? "Sending..."
                        : "Request Change"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* CANCELLATION */}

            {canRequestCancellation && (
              <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">
                <h2 className="text-lg font-bold sm:text-xl">
                  Request Cancellation
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  If you no longer need this order, you
                  can send a cancellation request.
                </p>

                <form
                  onSubmit={
                    handleCancellationRequest
                  }
                  className="mt-5"
                >
                  <textarea
                    rows={3}
                    value={
                      cancellationMessage
                    }
                    onChange={(event) =>
                      setCancellationMessage(
                        event.target.value
                      )
                    }
                    placeholder="Reason for cancellation"
                    className="w-full resize-none rounded-xl border border-zinc-300 px-3 py-3 text-sm leading-6 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 sm:px-4 sm:text-base"
                  />

                  <button
                    type="submit"
                    disabled={
                      requestingCancellation
                    }
                    className="mt-4 w-full rounded-full border border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-base"
                  >
                    {requestingCancellation
                      ? "Sending..."
                      : "Request Cancellation"}
                  </button>
                </form>
              </div>
            )}

            {/* CANCELLATION REQUESTED */}

            {order.cancellationRequested &&
              order.status !==
                "CANCELLED" && (
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 sm:rounded-3xl sm:p-7">
                  <p className="font-bold text-yellow-800">
                    Cancellation request submitted
                  </p>

                  {order.cancellationRequestMessage && (
                    <p className="mt-2 break-words text-sm leading-6 text-yellow-700">
                      {
                        order.cancellationRequestMessage
                      }
                    </p>
                  )}

                  <p className="mt-2 text-xs leading-5 text-yellow-600">
                    Sparsha Kitchen will review your request.
                  </p>
                </div>
              )}

            {/* ADDITIONAL INSTRUCTIONS */}

            {order.additionalInstructions && (
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">
                <h2 className="text-lg font-bold sm:text-xl">
                  Additional Instructions
                </h2>

                <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-zinc-600">
                  {
                    order.additionalInstructions
                  }
                </p>
              </div>
            )}

            {/* BOTTOM BUTTONS */}

            <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:justify-center">
              <Link
                href="/recipes"
                className="w-full rounded-full bg-orange-600 px-7 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-700 sm:w-auto sm:text-base"
              >
                Browse Recipes
              </Link>

              <Link
                href="/custom-recipe"
                className="w-full rounded-full border border-zinc-200 bg-white px-7 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto sm:text-base"
              >
                Request Custom Recipe
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ========================================
          FOOTER
      ======================================== */}

      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-8 lg:px-8">
          <div>
            <div className="font-bold text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="mt-1 text-zinc-500">
              Homemade food, prepared with care.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/"
              className="text-zinc-600 transition hover:text-orange-600"
            >
              Home
            </Link>

            <Link
              href="/recipes"
              className="text-zinc-600 transition hover:text-orange-600"
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