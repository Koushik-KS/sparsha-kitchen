"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api";

type OrderStatus =
  | "PENDING_CONFIRMATION"
  | "CUSTOMER_CONFIRMED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type OrderItem = {
  recipe?: {
    _id?: string;
    name?: string;
    photos?: string[];
    price?: number;
    unit?: string;
  } | null;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  isCustomRecipe: boolean;
};

type StatusHistory = {
  status: OrderStatus;
  changedAt: string;
  changedBy: "customer" | "admin" | "system";
  note: string;
};

type DeliveryPerson = {
  _id?: string;
  name: string;
  phone: string;
  whatsapp?: string;
  isActive?: boolean;
};

type PaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID";

type PaymentHistory = {
  _id?: string;
  amount: number;
  method:
    | "UPI"
    | "CASH"
    | "BANK_TRANSFER"
    | "OTHER";
  recordedAt: string;
  recordedBy?: string;
  note?: string;
};

type Order = {
  _id: string;
  orderId: string;

  customer: {
    name: string;
    phone: string;
    email?: string;
  };

  deliveryAddress: string;
  mapPin?: string;

  requestedDeliveryDate: string;
  requestedDeliveryTime: string;

  additionalInstructions?: string;

  items: OrderItem[];

  foodTotal: number;
  deliveryCharge: number;
  grandTotal: number;

  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  paymentHistory?: PaymentHistory[];

  deliveryPerson?: DeliveryPerson | null;

  status: OrderStatus;

  customerConfirmed: boolean;
  customerConfirmedAt?: string | null;

  adminConfirmed: boolean;
  adminConfirmedAt?: string | null;

  changeRequested: boolean;
  changeRequestMessage?: string;

  cancellationRequested: boolean;
  cancellationMessage?: string;

  statusHistory: StatusHistory[];

  createdAt: string;
  updatedAt: string;
};

type OrdersResponse = {
  success: boolean;
  message?: string;
  orders?: Order[];
};

type OrderResponse = {
  success: boolean;
  message?: string;
  order?: Order;
};

type DeliveryPersonsResponse = {
  success: boolean;
  message?: string;
  deliveryPersons?: DeliveryPerson[];
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "Pending Confirmation",
  CUSTOMER_CONFIRMED: "Customer Confirmed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION:
    "bg-yellow-100 text-yellow-800",
  CUSTOMER_CONFIRMED:
    "bg-blue-100 text-blue-800",
  CONFIRMED:
    "bg-green-100 text-green-800",
  PREPARING:
    "bg-orange-100 text-orange-800",
  READY:
    "bg-purple-100 text-purple-800",
  OUT_FOR_DELIVERY:
    "bg-indigo-100 text-indigo-800",
  DELIVERED:
    "bg-emerald-100 text-emerald-800",
  CANCELLED:
    "bg-red-100 text-red-800",
};

const NEXT_STATUS: Partial<
  Record<OrderStatus, OrderStatus>
> = {
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "OUT_FOR_DELIVERY",
};

const NEXT_STATUS_LABEL: Partial<
  Record<OrderStatus, string>
> = {
  CONFIRMED: "Start Preparing",
  PREPARING: "Mark Ready",
  READY: "Send for Delivery",
};

const getWhatsAppUrl = (phone: string) => {
  const digits = String(phone || "").replace(/\D/g, "");

  // Customer phone numbers are expected to be 10 digits in India.
  // Add India country code automatically for WhatsApp.
  const whatsappNumber =
    digits.length === 10
      ? `91${digits}`
      : digits.startsWith("91")
        ? digits
        : digits;

const message = encodeURIComponent(
  "*Welcome to Sparsha Kitchen! 🍽️*\n\n" +
  "Thank you for choosing Sparsha Kitchen. We’re delighted to serve you with fresh, delicious, and homestyle food prepared with care.\n\n" +
  "We look forward to serving you again! ❤️"
);

return `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${message}&type=phone_number&app_absent=0`;
};

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] =
    useState<DeliveryPerson[]>([]);

  const [loading, setLoading] = useState(true);
  const [deliveryLoading, setDeliveryLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | OrderStatus>("ALL");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [editingOrder, setEditingOrder] =
    useState<Order | null>(null);

  const [paymentOrder, setPaymentOrder] =
    useState<Order | null>(null);

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<
      "UPI" | "CASH" | "BANK_TRANSFER" | "OTHER"
    >("UPI");

  const [paymentNote, setPaymentNote] =
    useState("");

  const [otpOrder, setOtpOrder] =
    useState<Order | null>(null);

  const [deliveryOtp, setDeliveryOtp] =
    useState("");

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] =
    useState("");
  const [editMapPin, setEditMapPin] =
    useState("");
  const [editDate, setEditDate] =
    useState("");
  const [editTime, setEditTime] =
    useState("");
  const [editInstructions, setEditInstructions] =
    useState("");
  const [editDeliveryCharge, setEditDeliveryCharge] =
    useState("");

  const getToken = useCallback(() => {
    return localStorage.getItem("adminToken");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    router.push("/admin/login");
  }, [router]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        router.replace("/admin/login");
        return [];
      }

      const response = await fetch(
        `${API_URL}/admin/orders`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data: OrdersResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return [];
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load orders."
        );
      }

      const nextOrders = data.orders || [];

      setOrders(nextOrders);

      return nextOrders;
    } catch (err) {
      console.error(
        "Fetch admin orders error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders."
      );

      return [];
    } finally {
      setLoading(false);
    }
  }, [getToken, logout, router]);

  const fetchDeliveryPersons =
    useCallback(async () => {
      try {
        setDeliveryLoading(true);

        const token = getToken();

        if (!token) {
          router.replace("/admin/login");
          return;
        }

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

        setDeliveryPersons(
          data.deliveryPersons || []
        );
      } catch (err) {
        console.error(
          "Fetch delivery persons error:",
          err
        );
      } finally {
        setDeliveryLoading(false);
      }
    }, [getToken, logout, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchOrders();
      void fetchDeliveryPersons();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchOrders, fetchDeliveryPersons]);

  const filteredOrders = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !searchValue ||
        order.orderId
          .toLowerCase()
          .includes(searchValue) ||
        order.customer.name
          .toLowerCase()
          .includes(searchValue) ||
        order.customer.phone
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: orders.length,

      pending: orders.filter(
        (order) =>
          order.status ===
          "PENDING_CONFIRMATION"
      ).length,

      customerConfirmed: orders.filter(
        (order) =>
          order.status ===
          "CUSTOMER_CONFIRMED"
      ).length,

      confirmed: orders.filter(
        (order) =>
          order.status === "CONFIRMED"
      ).length,

      preparing: orders.filter(
        (order) =>
          order.status === "PREPARING"
      ).length,

      ready: orders.filter(
        (order) =>
          order.status === "READY"
      ).length,

      delivery: orders.filter(
        (order) =>
          order.status ===
          "OUT_FOR_DELIVERY"
      ).length,

      delivered: orders.filter(
        (order) =>
          order.status === "DELIVERED"
      ).length,

      cancelled: orders.filter(
        (order) =>
          order.status === "CANCELLED"
      ).length,

      cancellationRequests:
        orders.filter(
          (order) =>
            order.cancellationRequested
        ).length,

      changeRequests: orders.filter(
        (order) =>
          order.changeRequested
      ).length,
    };
  }, [orders]);

  const refreshSelectedOrder = (
    updatedOrders: Order[],
    orderId: string
  ) => {
    const updated = updatedOrders.find(
      (order) => order._id === orderId
    );

    if (updated) {
      setSelectedOrder(updated);
    }
  };

  const runOrderAction = async (
    orderId: string,
    request: () => Promise<Response>
  ) => {
    try {
      setActionLoading(orderId);
      setError("");
      setMessage("");

      const response = await request();

      const data: OrderResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Action failed."
        );
      }

      setMessage(
        data.message ||
          "Order updated successfully."
      );

      const updatedOrders =
        await fetchOrders();

      refreshSelectedOrder(
        updatedOrders,
        orderId
      );
    } catch (err) {
      console.error(
        "Order action error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const confirmOrder = async (
    order: Order
  ) => {
    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    await runOrderAction(
      order._id,
      () =>
        fetch(
          `${API_URL}/admin/orders/${order._id}/confirm`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
    );
  };

  const getPaidAmount = (order: Order) =>
    Number(order.paidAmount || 0);

  const getRemainingAmount = (
    order: Order
  ) =>
    Math.max(
      0,
      Number(order.grandTotal || 0) -
        getPaidAmount(order)
    );

  const getPaymentStatus = (
    order: Order
  ): PaymentStatus => {
    const paid = getPaidAmount(order);
    const total = Number(
      order.grandTotal || 0
    );

    if (paid >= total) {
      return "PAID";
    }

    if (paid > 0) {
      return "PARTIALLY_PAID";
    }

    return "UNPAID";
  };

  const openPayment = (order: Order) => {
    setError("");
    setMessage("");

    setPaymentOrder(order);

    const remaining =
      getRemainingAmount(order);

    setPaymentAmount(
      remaining > 0
        ? remaining.toFixed(2)
        : ""
    );

    setPaymentMethod("UPI");
    setPaymentNote("");
  };

  const addPayment = async () => {
    if (!paymentOrder) {
      return;
    }

    const amount =
      Number(paymentAmount);

    const remaining =
      getRemainingAmount(paymentOrder);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Payment amount must be greater than ₹0."
      );
      return;
    }

    if (
      amount >
      remaining + 0.001
    ) {
      setError(
        `Payment cannot exceed the remaining amount of ${formatMoney(
          remaining
        )}.`
      );
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setActionLoading(
        paymentOrder._id
      );

      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/admin/orders/${paymentOrder._id}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            method: paymentMethod,
            note: paymentNote.trim(),
          }),
        }
      );

      const data: OrderResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to record payment."
        );
      }

      setMessage(
        data.message ||
          "Payment recorded successfully."
      );

      setPaymentOrder(null);
      setPaymentAmount("");
      setPaymentNote("");

      const updatedOrders =
        await fetchOrders();

      refreshSelectedOrder(
        updatedOrders,
        paymentOrder._id
      );
    } catch (err) {
      console.error(
        "Add payment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to record payment."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const advanceOrder = async (
    order: Order
  ) => {
    /*
     * Delivery completion is special.
     * Remaining payment must be zero and
     * customer OTP must be verified.
     */

    if (
      order.status ===
      "OUT_FOR_DELIVERY"
    ) {
      const remaining =
        getRemainingAmount(order);

      if (remaining > 0.001) {
        setError(
          `Remaining payment of ${formatMoney(
            remaining
          )} must be confirmed before delivery OTP verification.`
        );

        setMessage("");
        return;
      }

      setError("");
      setMessage("");
      setDeliveryOtp("");
      setOtpOrder(order);

      return;
    }

    const nextStatus =
      NEXT_STATUS[order.status];

    if (!nextStatus) {
      return;
    }

    /*
     * Delivery person is required before
     * Preparing, Ready and Out for Delivery.
     */

    if (
      !order.deliveryPerson &&
      [
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(nextStatus)
    ) {
      setError(
        "Please assign a delivery person before continuing the order."
      );

      setMessage("");
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    await runOrderAction(
      order._id,
      () =>
        fetch(
          `${API_URL}/admin/orders/${order._id}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: nextStatus,
            }),
          }
        )
    );
  };

  const verifyDeliveryOtp = async () => {
    if (!otpOrder) {
      return;
    }

    const otp =
      deliveryOtp.trim();

    if (!/^\d{6}$/.test(otp)) {
      setError(
        "Enter the 6-digit delivery OTP."
      );
      return;
    }

    const remaining =
      getRemainingAmount(otpOrder);

    if (remaining > 0.001) {
      setError(
        `Remaining payment of ${formatMoney(
          remaining
        )} must be confirmed first.`
      );
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setActionLoading(
        otpOrder._id
      );

      setError("");
      setMessage("");

      const verifyResponse =
        await fetch(
          `${API_URL}/admin/orders/${otpOrder._id}/verify-otp`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              otp,
            }),
          }
        );

      const verifyData: OrderResponse =
        await verifyResponse.json();

      if (
        verifyResponse.status === 401
      ) {
        logout();
        return;
      }

      if (
        !verifyResponse.ok ||
        !verifyData.success
      ) {
        throw new Error(
          verifyData.message ||
            "Invalid delivery OTP."
        );
      }

      const deliveredResponse =
        await fetch(
          `${API_URL}/admin/orders/${otpOrder._id}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: "DELIVERED",
            }),
          }
        );

      const deliveredData: OrderResponse =
        await deliveredResponse.json();

      if (
        !deliveredResponse.ok ||
        !deliveredData.success
      ) {
        throw new Error(
          deliveredData.message ||
            "OTP verified, but the order could not be marked delivered."
        );
      }

      setMessage(
        "Delivery OTP verified. Order marked as delivered."
      );

      setOtpOrder(null);
      setDeliveryOtp("");

      const updatedOrders =
        await fetchOrders();

      refreshSelectedOrder(
        updatedOrders,
        otpOrder._id
      );
    } catch (err) {
      console.error(
        "Delivery OTP verification error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify delivery OTP."
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * ADMIN DIRECT CANCEL ORDER
   *
   * This is separate from the customer
   * cancellation-request workflow.
   *
   * Endpoint:
   * PATCH /api/admin/orders/:id/cancel
   */
  const cancelOrder = async (
    order: Order
  ) => {
    if (
      [
        "DELIVERED",
        "CANCELLED",
        "OUT_FOR_DELIVERY",
      ].includes(order.status)
    ) {
      setError(
        "This order cannot be cancelled at this stage."
      );
      setMessage("");
      return;
    }

    const confirmed =
      window.confirm(
        `Cancel order ${order.orderId}?\n\nThis will permanently change the order status to CANCELLED.`
      );

    if (!confirmed) {
      return;
    }

    const note =
      window.prompt(
        "Cancellation reason (optional):"
      ) || "";

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    await runOrderAction(
      order._id,
      () =>
        fetch(
          `${API_URL}/admin/orders/${order._id}/cancel`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              note: note.trim(),
            }),
          }
        )
    );
  };

  /*
   * DELETE ORDER
   *
   * Requires backend:
   * DELETE /api/admin/orders/:id
   */
  const deleteOrder = async (
    order: Order
  ) => {
    const confirmed =
      window.confirm(
        `DELETE ORDER ${order.orderId}?\n\nThis permanently removes the order and its stored order data.\n\nThis cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setActionLoading(
        order._id
      );

      setError("");
      setMessage("");

      const response =
        await fetch(
          `${API_URL}/admin/orders/${order._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data: OrderResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to delete order."
        );
      }

      setSelectedOrder(null);

      setMessage(
        data.message ||
          "Order deleted successfully."
      );

      await fetchOrders();
    } catch (err) {
      console.error(
        "Delete order error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancellation = async (
    order: Order,
    action: "approve" | "reject"
  ) => {
    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    const note =
      window.prompt(
        action === "approve"
          ? "Optional cancellation note:"
          : "Optional rejection note:"
      ) || "";

    await runOrderAction(
      order._id,
      () =>
        fetch(
          `${API_URL}/admin/orders/${order._id}/cancellation`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action,
              note,
            }),
          }
        )
    );
  };

  const assignDeliveryPerson =
    async (
      order: Order,
      deliveryPersonId: string
    ) => {
      if (!deliveryPersonId) {
        return;
      }

      const token = getToken();

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      await runOrderAction(
        order._id,
        () =>
          fetch(
            `${API_URL}/admin/delivery-persons/order/${order._id}/assign`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                deliveryPersonId,
              }),
            }
          )
      );
    };

  const removeDeliveryPerson =
    async (order: Order) => {
      const confirmed =
        window.confirm(
          "Remove the delivery person from this order?"
        );

      if (!confirmed) {
        return;
      }

      const token = getToken();

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      await runOrderAction(
        order._id,
        () =>
          fetch(
            `${API_URL}/admin/delivery-persons/order/${order._id}/remove`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
      );
    };

  const openEditOrder = (
    order: Order
  ) => {
    setError("");
    setMessage("");

    setEditingOrder(order);

    setEditName(
      order.customer.name || ""
    );

    setEditPhone(
      order.customer.phone || ""
    );

    setEditEmail(
      order.customer.email || ""
    );

    setEditAddress(
      order.deliveryAddress || ""
    );

    setEditMapPin(
      order.mapPin || ""
    );

    setEditDate(
      order.requestedDeliveryDate
        ? new Date(
            order.requestedDeliveryDate
          )
            .toISOString()
            .split("T")[0]
        : ""
    );

    setEditTime(
      order.requestedDeliveryTime || ""
    );

    setEditInstructions(
      order.additionalInstructions || ""
    );

    setEditDeliveryCharge(
      String(
        order.deliveryCharge || 0
      )
    );
  };

  const saveOrderEdit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editingOrder) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    if (!editName.trim()) {
      setError(
        "Customer name cannot be empty."
      );
      return;
    }

    if (!editPhone.trim()) {
      setError(
        "Customer phone cannot be empty."
      );
      return;
    }

    if (!editAddress.trim()) {
      setError(
        "Delivery address cannot be empty."
      );
      return;
    }

    if (!editDate) {
      setError(
        "Delivery date is required."
      );
      return;
    }

    if (!editTime.trim()) {
      setError(
        "Delivery time is required."
      );
      return;
    }

    const deliveryCharge =
      Number(editDeliveryCharge);

    if (
      !Number.isFinite(
        deliveryCharge
      ) ||
      deliveryCharge < 0
    ) {
      setError(
        "Delivery charge must be a valid number."
      );
      return;
    }

    try {
      setActionLoading(
        editingOrder._id
      );

      setError("");
      setMessage("");

      const items =
        editingOrder.items.map(
          (item) => ({
            recipeId:
              item.recipe?._id,
            quantity:
              item.quantity,
            unit:
              item.unit,
            customPrice:
              item.isCustomRecipe
                ? item.pricePerUnit
                : undefined,
            isCustomRecipe:
              item.isCustomRecipe,
          })
        );

      const invalidItem =
        items.find(
          (item) =>
            !item.isCustomRecipe &&
            !item.recipeId
        );

      if (invalidItem) {
        throw new Error(
          "One or more order items are missing their recipe ID. This order cannot be edited until the recipe information is available."
        );
      }

      const response =
        await fetch(
          `${API_URL}/admin/orders/${editingOrder._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              customer: {
                name:
                  editName.trim(),
                phone:
                  editPhone.trim(),
                email:
                  editEmail
                    .trim()
                    .toLowerCase(),
              },

              deliveryAddress:
                editAddress.trim(),

              mapPin:
                editMapPin.trim(),

              requestedDeliveryDate:
                editDate,

              requestedDeliveryTime:
                editTime.trim(),

              additionalInstructions:
                editInstructions.trim(),

              items,

              deliveryCharge,
            }),
          }
        );

      const data: OrderResponse =
        await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to update order."
        );
      }

      setMessage(
        data.message ||
          "Order updated successfully."
      );

      setEditingOrder(null);

      const updatedOrders =
        await fetchOrders();

      refreshSelectedOrder(
        updatedOrders,
        editingOrder._id
      );
    } catch (err) {
      console.error(
        "Edit order error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (
    value: string
  ) => {
    if (!value) {
      return "-";
    }

    return new Date(
      value
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (
    value: string
  ) => {
    if (!value) {
      return "-";
    }

    return new Date(
      value
    ).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatMoney = (
    value: number
  ) => {
    return `₹${Number(
      value || 0
    ).toFixed(2)}`;
  };

  const getActionText = (
    order: Order
  ) => {
    if (
      order.status ===
      "CUSTOMER_CONFIRMED"
    ) {
      return "Confirm Order";
    }

    if (
      order.status ===
      "OUT_FOR_DELIVERY"
    ) {
      return "Verify OTP & Deliver";
    }

    return (
      NEXT_STATUS_LABEL[
        order.status
      ] || ""
    );
  };

  /*
   * IMPORTANT:
   *
   * CUSTOMER_CONFIRMED is NOT included here.
   *
   * That prevents the duplicate Confirm Order
   * button that appeared in your screenshot.
   */
  const hasActionButton = (
    order: Order
  ) => {
    return (
      order.status ===
        "OUT_FOR_DELIVERY" ||
      Boolean(
        NEXT_STATUS[order.status]
      )
    );
  };

  const renderDeliverySection = (
    order: Order
  ) => {
    const assignedId =
      order.deliveryPerson?._id || "";

    return (
      <section>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold">
            Delivery Person
          </h3>

          {order.deliveryPerson && (
            <button
              type="button"
              disabled={
                actionLoading ===
                order._id
              }
              onClick={() =>
                void removeDeliveryPerson(
                  order
                )
              }
              className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>

        <div className="mt-3 rounded-2xl bg-zinc-50 p-4">
          {order.deliveryPerson ? (
            <div>
              <p className="font-bold">
                {
                  order
                    .deliveryPerson
                    .name
                }
              </p>

              <p className="mt-1 text-sm text-zinc-600">
                Phone:{" "}
                {
                  order
                    .deliveryPerson
                    .phone
                }
              </p>

              {order.deliveryPerson
                .whatsapp && (
                <p className="mt-1 text-sm text-zinc-600">
                  WhatsApp:{" "}
                  {
                    order
                      .deliveryPerson
                      .whatsapp
                  }
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              No delivery person assigned.
            </p>
          )}

          {![
            "DELIVERED",
            "CANCELLED",
          ].includes(
            order.status
          ) && (
            <div className="mt-4">
              <label
                htmlFor={`delivery-${order._id}`}
                className="block text-sm font-semibold"
              >
                Assign Delivery Person
              </label>

              <select
                id={`delivery-${order._id}`}
                value={assignedId}
                disabled={
                  deliveryLoading ||
                  actionLoading ===
                    order._id
                }
                onChange={(event) => {
                  void assignDeliveryPerson(
                    order,
                    event.target.value
                  );
                }}
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  {deliveryLoading
                    ? "Loading delivery persons..."
                    : order.deliveryPerson
                      ? "Select another person"
                      : "Select delivery person"}
                </option>

                {deliveryPersons
                  .filter(
                    (person) =>
                      person.isActive !==
                      false
                  )
                  .map((person) => (
                    <option
                      key={person._id}
                      value={person._id}
                    >
                      {
                        person.name
                      }{" "}
                      —{" "}
                      {
                        person.phone
                      }
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-orange-50 text-zinc-900">
      {/* HEADER */}

      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <div className="text-2xl font-bold tracking-tight text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="text-xs font-medium text-zinc-500">
              Admin Panel · Orders
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/admin")
              }
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Recipes
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

      {/* MAIN */}

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-semibold uppercase tracking-wide text-orange-600">
              Dashboard
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Order Management
            </h1>

            <p className="mt-3 max-w-2xl text-zinc-600">
              Review customer orders,
              confirmations, requests,
              delivery assignments, payments,
              and delivery progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void fetchOrders();
              void fetchDeliveryPersons();
            }}
            disabled={loading}
            className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh Orders"}
          </button>
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

        {/* COUNTS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ALL");
              setSearch("");
            }}
            className="rounded-2xl border border-orange-100 bg-white p-5 text-left shadow-sm transition hover:border-orange-300"
          >
            <p className="text-sm text-zinc-500">
              All Orders
            </p>

            <p className="mt-1 text-3xl font-bold">
              {counts.all}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "PENDING_CONFIRMATION"
              )
            }
            className="rounded-2xl border border-orange-100 bg-white p-5 text-left shadow-sm transition hover:border-orange-300"
          >
            <p className="text-sm text-zinc-500">
              Pending
            </p>

            <p className="mt-1 text-3xl font-bold text-yellow-700">
              {counts.pending}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "CUSTOMER_CONFIRMED"
              )
            }
            className="rounded-2xl border border-orange-100 bg-white p-5 text-left shadow-sm transition hover:border-orange-300"
          >
            <p className="text-sm text-zinc-500">
              Customer Confirmed
            </p>

            <p className="mt-1 text-3xl font-bold text-blue-700">
              {counts.customerConfirmed}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter("CONFIRMED")
            }
            className="rounded-2xl border border-orange-100 bg-white p-5 text-left shadow-sm transition hover:border-orange-300"
          >
            <p className="text-sm text-zinc-500">
              Confirmed
            </p>

            <p className="mt-1 text-3xl font-bold text-green-700">
              {counts.confirmed}
            </p>
          </button>
        </div>

        {/* SEARCH */}

        <div className="mt-8 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <div>
              <label
                htmlFor="order-search"
                className="block text-sm font-semibold text-zinc-800"
              >
                Search Orders
              </label>

              <input
                id="order-search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Order ID, customer name, or phone"
                className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-semibold text-zinc-800"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | "ALL"
                      | OrderStatus
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="ALL">
                  All Statuses
                </option>

                {Object.entries(
                  STATUS_LABELS
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span>
              {filteredOrders.length}{" "}
              matching order
              {filteredOrders.length ===
              1
                ? ""
                : "s"}
            </span>

            {counts.cancellationRequests >
              0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">
                {
                  counts.cancellationRequests
                }{" "}
                cancellation request
                {counts.cancellationRequests ===
                1
                  ? ""
                  : "s"}
              </span>
            )}

            {counts.changeRequests >
              0 && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 font-semibold text-yellow-700">
                {counts.changeRequests}{" "}
                change request
                {counts.changeRequests ===
                1
                  ? ""
                  : "s"}
              </span>
            )}
          </div>
        </div>

        {/* ORDER LIST */}

        <div className="mt-8">
          {loading ? (
            <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />

              <p className="mt-5 text-zinc-600">
                Loading orders...
              </p>
            </div>
          ) : filteredOrders.length ===
            0 ? (
            <div className="rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-sm">
              <div className="text-6xl">
                📦
              </div>

              <h2 className="mt-5 text-xl font-bold">
                No orders found
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Try changing the search
                or status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map(
                (order) => (
                  <article
                    key={order._id}
                    className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm"
                  >
                    <div className="p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold">
                              {order.orderId}
                            </h2>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[order.status]}`}
                            >
                              {
                                STATUS_LABELS[
                                  order.status
                                ]
                              }
                            </span>

                            {order.customerConfirmed && (
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                Customer Confirmed
                              </span>
                            )}

                            {order.adminConfirmed && (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Admin Confirmed
                              </span>
                            )}
                          </div>

                          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                            <div>
                              <span className="font-semibold">
                                Customer:
                              </span>{" "}
                              {
                                order
                                  .customer
                                  .name
                              }
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span>
                                <span className="font-semibold">
                                  Phone:
                                </span>{" "}
                                {
                                  order
                                    .customer
                                    .phone
                                }
                              </span>

                              {order.customer.phone && (
                                <a
                                  href={getWhatsAppUrl(
                                    order.customer.phone
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 transition hover:bg-green-200"
                                  title="Open WhatsApp chat"
                                >
                                  <span aria-hidden="true">🟢</span>
                                  WhatsApp
                                </a>
                              )}
                            </div>

                            <div>
                              <span className="font-semibold">
                                Delivery:
                              </span>{" "}
                              {formatDate(
                                order.requestedDeliveryDate
                              )}{" "}
                              ·{" "}
                              {
                                order.requestedDeliveryTime
                              }
                            </div>

                            <div>
                              <span className="font-semibold">
                                Total:
                              </span>{" "}
                              <span className="font-bold text-orange-600">
                                {formatMoney(
                                  order.grandTotal
                                )}
                              </span>
                            </div>

                            <div>
                              <span className="font-semibold">
                                Paid / Remaining:
                              </span>{" "}
                              {formatMoney(
                                getPaidAmount(
                                  order
                                )
                              )}{" "}
                              /{" "}
                              {formatMoney(
                                getRemainingAmount(
                                  order
                                )
                              )}
                            </div>
                          </div>

                          {/* DELIVERY ADDRESS */}

                          <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                              Delivery Address
                            </p>

                            <p className="mt-1 text-sm font-semibold text-zinc-800">
                              {order.deliveryAddress ||
                                "No address provided"}
                            </p>

                            {order.mapPin && (
                              <p className="mt-2 break-all text-xs text-zinc-500">
                                Map Pin:{" "}
                                {
                                  order.mapPin
                                }
                              </p>
                            )}
                          </div>

                          {order.deliveryPerson && (
                            <div className="mt-4 rounded-2xl bg-indigo-50 p-3 text-sm">
                              <span className="font-semibold text-indigo-800">
                                Delivery Person:
                              </span>{" "}
                              {
                                order
                                  .deliveryPerson
                                  .name
                              }{" "}
                              ·{" "}
                              {
                                order
                                  .deliveryPerson
                                  .phone
                              }
                            </div>
                          )}

                          {order.cancellationRequested && (
                            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                              <p className="font-semibold text-red-700">
                                Cancellation requested
                              </p>

                              <p className="mt-1 text-sm text-red-700">
                                {
                                  order.cancellationMessage ||
                                  "Customer requested cancellation."
                                }
                              </p>
                            </div>
                          )}

                          {order.changeRequested && (
                            <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                              <p className="font-semibold text-yellow-800">
                                Change requested
                              </p>

                              <p className="mt-1 text-sm text-yellow-800">
                                {
                                  order.changeRequestMessage ||
                                  "Customer requested an order change."
                                }
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedOrder(
                                order
                              )
                            }
                            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            View Details
                          </button>

                          {![
                            "DELIVERED",
                            "CANCELLED",
                          ].includes(
                            order.status
                          ) && (
                            <button
                              type="button"
                              onClick={() =>
                                openEditOrder(
                                  order
                                )
                              }
                              className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                            >
                              Edit Order
                            </button>
                          )}

                          {order.status ===
                            "CUSTOMER_CONFIRMED" &&
                            !order.adminConfirmed && (
                              <button
                                type="button"
                                disabled={
                                  actionLoading ===
                                  order._id
                                }
                                onClick={() =>
                                  void confirmOrder(
                                    order
                                  )
                                }
                                className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actionLoading ===
                                order._id
                                  ? "Updating..."
                                  : "Confirm Order"}
                              </button>
                            )}

                          {hasActionButton(
                            order
                          ) && (
                            <button
                              type="button"
                              disabled={
                                actionLoading ===
                                order._id
                              }
                              onClick={() =>
                                void advanceOrder(
                                  order
                                )
                              }
                              className="rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionLoading ===
                              order._id
                                ? "Updating..."
                                : getActionText(
                                    order
                                  )}
                            </button>
                          )}

                          {order.cancellationRequested && (
                            <>
                              <button
                                type="button"
                                disabled={
                                  actionLoading ===
                                  order._id
                                }
                                onClick={() =>
                                  void handleCancellation(
                                    order,
                                    "approve"
                                  )
                                }
                                className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Approve Cancellation
                              </button>

                              <button
                                type="button"
                                disabled={
                                  actionLoading ===
                                  order._id
                                }
                                onClick={() =>
                                  void handleCancellation(
                                    order,
                                    "reject"
                                  )
                                }
                                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 border-t border-zinc-100 pt-5">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                              Items
                            </p>

                            <p className="mt-1 font-semibold">
                              {
                                order.items
                                  .length
                              }{" "}
                              {order.items
                                .length ===
                              1
                                ? "item"
                                : "items"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                              Food Total
                            </p>

                            <p className="mt-1 font-semibold">
                              {formatMoney(
                                order.foodTotal
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                              Delivery
                            </p>

                            <p className="mt-1 font-semibold">
                              {formatMoney(
                                order.deliveryCharge
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                              Created
                            </p>

                            <p className="mt-1 font-semibold">
                              {formatDateTime(
                                order.createdAt
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                              Delivery Person
                            </p>

                            <p className="mt-1 font-semibold">
                              {order.deliveryPerson
                                ?.name ||
                                "Not assigned"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* ORDER DETAILS MODAL */}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 sm:p-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-zinc-100 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                  Order Details
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {
                    selectedOrder.orderId
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-7 p-6">
              {/* STATUS */}

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[selectedOrder.status]}`}
                >
                  {
                    STATUS_LABELS[
                      selectedOrder.status
                    ]
                  }
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedOrder.customerConfirmed
                      ? "bg-blue-100 text-blue-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  Customer:{" "}
                  {selectedOrder.customerConfirmed
                    ? "Confirmed"
                    : "Not Confirmed"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedOrder.adminConfirmed
                      ? "bg-green-100 text-green-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  Admin:{" "}
                  {selectedOrder.adminConfirmed
                    ? "Confirmed"
                    : "Not Confirmed"}
                </span>
              </div>

              {/* CUSTOMER */}

              <section>
                <h3 className="text-lg font-bold">
                  Customer
                </h3>

                <div className="mt-3 rounded-2xl bg-zinc-50 p-4 text-sm">
                  <p>
                    <span className="font-semibold">
                      Name:
                    </span>{" "}
                    {
                      selectedOrder
                        .customer.name
                    }
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p>
                      <span className="font-semibold">
                        Phone:
                      </span>{" "}
                      {
                        selectedOrder
                          .customer.phone
                      }
                    </p>

                    {selectedOrder.customer.phone && (
                      <a
                        href={getWhatsAppUrl(
                          selectedOrder.customer.phone
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 transition hover:bg-green-200"
                        title="Open WhatsApp chat"
                      >
                        <span aria-hidden="true">🟢</span>
                        WhatsApp
                      </a>
                    )}
                  </div>

                  {selectedOrder
                    .customer.email && (
                    <p className="mt-2">
                      <span className="font-semibold">
                        Email:
                      </span>{" "}
                      {
                        selectedOrder
                          .customer
                          .email
                      }
                    </p>
                  )}
                </div>
              </section>

              {/* DELIVERY */}

              <section>
                <h3 className="text-lg font-bold">
                  Delivery
                </h3>

                <div className="mt-3 rounded-2xl bg-zinc-50 p-4 text-sm">
                  <p>
                    <span className="font-semibold">
                      Address:
                    </span>{" "}
                    {
                      selectedOrder.deliveryAddress ||
                      "No address provided"
                    }
                  </p>

                  {selectedOrder.mapPin && (
                    <p className="mt-2">
                      <span className="font-semibold">
                        Map Pin:
                      </span>{" "}
                      {
                        selectedOrder.mapPin
                      }
                    </p>
                  )}

                  <p className="mt-2">
                    <span className="font-semibold">
                      Date:
                    </span>{" "}
                    {formatDate(
                      selectedOrder.requestedDeliveryDate
                    )}
                  </p>

                  <p className="mt-2">
                    <span className="font-semibold">
                      Time:
                    </span>{" "}
                    {
                      selectedOrder.requestedDeliveryTime
                    }
                  </p>

                  {selectedOrder
                    .additionalInstructions && (
                    <p className="mt-2">
                      <span className="font-semibold">
                        Instructions:
                      </span>{" "}
                      {
                        selectedOrder
                          .additionalInstructions
                      }
                    </p>
                  )}
                </div>
              </section>

              {/* DELIVERY PERSON */}

              {renderDeliverySection(
                selectedOrder
              )}

              {/* ORDER ITEMS */}

              <section>
                <h3 className="text-lg font-bold">
                  Order Items
                </h3>

                <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200">
                  {selectedOrder.items.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex flex-col gap-2 border-b border-zinc-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold">
                            {item.name}
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            {item.quantity}{" "}
                            {item.unit} ×{" "}
                            {formatMoney(
                              item.pricePerUnit
                            )}

                            {item.isCustomRecipe && (
                              <span className="ml-2 rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                                Custom
                              </span>
                            )}
                          </p>
                        </div>

                        <p className="font-bold text-orange-600">
                          {formatMoney(
                            item.totalPrice
                          )}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </section>

              {/* PAYMENT */}

              <section>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">
                    Price & Payment
                  </h3>

                  {getRemainingAmount(
                    selectedOrder
                  ) > 0.001 && (
                    <button
                      type="button"
                      disabled={
                        actionLoading ===
                        selectedOrder._id
                      }
                      onClick={() =>
                        openPayment(
                          selectedOrder
                        )
                      }
                      className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Add Payment
                    </button>
                  )}
                </div>

                <div className="mt-3 rounded-2xl bg-zinc-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span>
                      Food Total
                    </span>

                    <span>
                      {formatMoney(
                        selectedOrder.foodTotal
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span>
                      Delivery Charge
                    </span>

                    <span>
                      {formatMoney(
                        selectedOrder.deliveryCharge
                      )}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4 text-lg font-bold">
                    <span>
                      Grand Total
                    </span>

                    <span className="text-orange-600">
                      {formatMoney(
                        selectedOrder.grandTotal
                      )}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Paid
                      </p>

                      <p className="mt-1 font-bold text-green-700">
                        {formatMoney(
                          getPaidAmount(
                            selectedOrder
                          )
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Remaining
                      </p>

                      <p className="mt-1 font-bold text-orange-700">
                        {formatMoney(
                          getRemainingAmount(
                            selectedOrder
                          )
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Payment Status
                      </p>

                      <p className="mt-1 font-bold">
                        {getPaymentStatus(
                          selectedOrder
                        ).replace(
                          "_",
                          " "
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.paymentHistory &&
                    selectedOrder
                      .paymentHistory
                      .length > 0 && (
                      <div className="mt-5">
                        <p className="text-sm font-bold">
                          Payment History
                        </p>

                        <div className="mt-2 space-y-2">
                          {selectedOrder.paymentHistory
                            .slice()
                            .reverse()
                            .map(
                              (
                                payment,
                                index
                              ) => (
                                <div
                                  key={
                                    payment._id ||
                                    `${payment.recordedAt}-${index}`
                                  }
                                  className="rounded-xl border border-zinc-200 bg-white p-3 text-sm"
                                >
                                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="font-semibold">
                                      {formatMoney(
                                        payment.amount
                                      )}{" "}
                                      ·{" "}
                                      {payment.method.replace(
                                        "_",
                                        " "
                                      )}
                                    </span>

                                    <span className="text-xs text-zinc-500">
                                      {formatDateTime(
                                        payment.recordedAt
                                      )}
                                    </span>
                                  </div>

                                  {payment.note && (
                                    <p className="mt-1 text-xs text-zinc-500">
                                      {
                                        payment.note
                                      }
                                    </p>
                                  )}

                                  {payment.recordedBy && (
                                    <p className="mt-1 text-xs text-zinc-400">
                                      Recorded by:{" "}
                                      {
                                        payment.recordedBy
                                      }
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                        </div>
                      </div>
                    )}
                </div>
              </section>

              {/* CANCELLATION */}

              {selectedOrder.cancellationRequested && (
                <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <h3 className="font-bold text-red-700">
                    Cancellation Request
                  </h3>

                  <p className="mt-2 text-sm text-red-700">
                    {
                      selectedOrder.cancellationMessage ||
                      "Customer requested cancellation."
                    }
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={
                        actionLoading ===
                        selectedOrder._id
                      }
                      onClick={() =>
                        void handleCancellation(
                          selectedOrder,
                          "approve"
                        )
                      }
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Approve Cancellation
                    </button>

                    <button
                      type="button"
                      disabled={
                        actionLoading ===
                        selectedOrder._id
                      }
                      onClick={() =>
                        void handleCancellation(
                          selectedOrder,
                          "reject"
                        )
                      }
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Reject
                    </button>
                  </div>
                </section>
              )}

              {/* CHANGE REQUEST */}

              {selectedOrder.changeRequested && (
                <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                  <h3 className="font-bold text-yellow-800">
                    Change Request
                  </h3>

                  <p className="mt-2 text-sm text-yellow-800">
                    {
                      selectedOrder.changeRequestMessage ||
                      "Customer requested an order change."
                    }
                  </p>

                  <p className="mt-3 text-xs text-yellow-700">
                    Edit the order using
                    the Edit Order button.
                    Saving changes resets
                    customer confirmation
                    and requires the customer
                    to confirm again.
                  </p>
                </section>
              )}

              {/* STATUS HISTORY */}

              <section>
                <h3 className="text-lg font-bold">
                  Status History
                </h3>

                <div className="mt-3 space-y-3">
                  {selectedOrder.statusHistory
                    ?.slice()
                    .reverse()
                    .map(
                      (
                        history,
                        index
                      ) => (
                        <div
                          key={`${history.changedAt}-${index}`}
                          className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-semibold">
                              {
                                STATUS_LABELS[
                                  history.status
                                ]
                              }
                            </span>

                            <span className="text-xs text-zinc-500">
                              {formatDateTime(
                                history.changedAt
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-zinc-500">
                            Changed by:{" "}
                            {
                              history.changedBy
                            }
                          </p>

                          {history.note && (
                            <p className="mt-2 text-sm text-zinc-600">
                              {
                                history.note
                              }
                            </p>
                          )}
                        </div>
                      )
                    )}
                </div>
              </section>

              {/* ACTIONS */}

              <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-6">
                {![
                  "DELIVERED",
                  "CANCELLED",
                ].includes(
                  selectedOrder.status
                ) && (
                  <button
                    type="button"
                    onClick={() =>
                      openEditOrder(
                        selectedOrder
                      )
                    }
                    className="rounded-full border border-orange-200 px-5 py-3 text-sm font-bold text-orange-700 hover:bg-orange-50"
                  >
                    Edit Order
                  </button>
                )}

                {/* CANCEL ORDER */}

                {![
                  "DELIVERED",
                  "CANCELLED",
                  "OUT_FOR_DELIVERY",
                ].includes(
                  selectedOrder.status
                ) && (
                  <button
                    type="button"
                    disabled={
                      actionLoading ===
                      selectedOrder._id
                    }
                    onClick={() =>
                      void cancelOrder(
                        selectedOrder
                      )
                    }
                    className="rounded-full border border-red-200 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                )}

                {/* CONFIRM ORDER */}

                {selectedOrder.status ===
                  "CUSTOMER_CONFIRMED" &&
                  !selectedOrder.adminConfirmed && (
                    <button
                      type="button"
                      disabled={
                        actionLoading ===
                        selectedOrder._id
                      }
                      onClick={() =>
                        void confirmOrder(
                          selectedOrder
                        )
                      }
                      className="rounded-full bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ===
                      selectedOrder._id
                        ? "Updating..."
                        : "Confirm Order"}
                    </button>
                  )}

                {/* NEXT STATUS */}

                {hasActionButton(
                  selectedOrder
                ) && (
                  <button
                    type="button"
                    disabled={
                      actionLoading ===
                      selectedOrder._id
                    }
                    onClick={() =>
                      void advanceOrder(
                        selectedOrder
                      )
                    }
                    className="rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    {actionLoading ===
                    selectedOrder._id
                      ? "Updating..."
                      : getActionText(
                          selectedOrder
                        )}
                  </button>
                )}

                {/* DELETE */}

                <button
                  type="button"
                  disabled={
                    actionLoading ===
                    selectedOrder._id
                  }
                  onClick={() =>
                    void deleteOrder(
                      selectedOrder
                    )
                  }
                  className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ===
                  selectedOrder._id
                    ? "Processing..."
                    : "Delete Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}

      {paymentOrder && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/40 p-4 sm:p-8">
          <div className="mx-auto max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  Record Payment
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {
                    paymentOrder.orderId
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPaymentOrder(
                    null
                  )
                }
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Grand Total
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {formatMoney(
                      paymentOrder.grandTotal
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Remaining
                  </p>

                  <p className="mt-1 text-lg font-bold text-orange-600">
                    {formatMoney(
                      getRemainingAmount(
                        paymentOrder
                      )
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold">
                  Payment Amount
                </label>

                <input
                  type="number"
                  min="0.01"
                  max={getRemainingAmount(
                    paymentOrder
                  )}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) =>
                    setPaymentAmount(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold">
                  Payment Method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target
                        .value as typeof paymentMethod
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                >
                  <option value="UPI">
                    UPI
                  </option>

                  <option value="CASH">
                    Cash
                  </option>

                  <option value="BANK_TRANSFER">
                    Bank Transfer
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold">
                  Note (optional)
                </label>

                <textarea
                  rows={3}
                  value={paymentNote}
                  onChange={(event) =>
                    setPaymentNote(
                      event.target.value
                    )
                  }
                  placeholder="Payment reference or note"
                  className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div className="flex gap-3 border-t border-zinc-100 pt-5">
                <button
                  type="button"
                  disabled={
                    actionLoading ===
                    paymentOrder._id
                  }
                  onClick={() =>
                    void addPayment()
                  }
                  className="flex-1 rounded-full bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ===
                  paymentOrder._id
                    ? "Saving..."
                    : "Confirm Payment"}
                </button>

                <button
                  type="button"
                  disabled={
                    actionLoading ===
                    paymentOrder._id
                  }
                  onClick={() =>
                    setPaymentOrder(
                      null
                    )
                  }
                  className="rounded-full border border-zinc-200 px-5 py-3 font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY OTP MODAL */}

      {otpOrder && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-zinc-100 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Delivery Verification
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {otpOrder.orderId}
              </h2>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-800">
                Remaining payment is confirmed at{" "}
                <strong>
                  {formatMoney(
                    getRemainingAmount(
                      otpOrder
                    )
                  )}
                </strong>
                .
                <br />
                Enter the 6-digit OTP provided
                by the customer to complete
                delivery.
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span>
                    Order Total
                  </span>

                  <strong>
                    {formatMoney(
                      otpOrder.grandTotal
                    )}
                  </strong>
                </div>

                <div className="mt-2 flex justify-between">
                  <span>
                    Paid
                  </span>

                  <strong className="text-green-700">
                    {formatMoney(
                      getPaidAmount(
                        otpOrder
                      )
                    )}
                  </strong>
                </div>

                <div className="mt-2 flex justify-between">
                  <span>
                    Remaining
                  </span>

                  <strong className="text-green-700">
                    {formatMoney(
                      getRemainingAmount(
                        otpOrder
                      )
                    )}
                  </strong>
                </div>
              </div>

              <div>
                <label
                  htmlFor="delivery-otp"
                  className="block text-sm font-semibold"
                >
                  Delivery OTP
                </label>

                <input
                  id="delivery-otp"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={deliveryOtp}
                  onChange={(event) =>
                    setDeliveryOtp(
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit OTP"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex gap-3 border-t border-zinc-100 pt-5">
                <button
                  type="button"
                  disabled={
                    actionLoading ===
                      otpOrder._id ||
                    deliveryOtp.length !==
                      6
                  }
                  onClick={() =>
                    void verifyDeliveryOtp()
                  }
                  className="flex-1 rounded-full bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ===
                  otpOrder._id
                    ? "Verifying..."
                    : "Verify OTP & Deliver"}
                </button>

                <button
                  type="button"
                  disabled={
                    actionLoading ===
                    otpOrder._id
                  }
                  onClick={() =>
                    setOtpOrder(null)
                  }
                  className="rounded-full border border-zinc-200 px-5 py-3 font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL */}

      {editingOrder && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 p-4 sm:p-8">
          <div className="mx-auto max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-zinc-100 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                  Edit Order
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {
                    editingOrder.orderId
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingOrder(
                    null
                  )
                }
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={saveOrderEdit}
              className="space-y-6 p-6"
            >
              {/* CUSTOMER DETAILS */}

              <div>
                <h3 className="text-lg font-bold">
                  Customer Details
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-name"
                      className="block text-sm font-semibold"
                    >
                      Customer Name
                    </label>

                    <input
                      id="edit-name"
                      type="text"
                      value={editName}
                      onChange={(event) =>
                        setEditName(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-phone"
                      className="block text-sm font-semibold"
                    >
                      Phone
                    </label>

                    <input
                      id="edit-phone"
                      type="text"
                      value={editPhone}
                      onChange={(event) =>
                        setEditPhone(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="edit-email"
                      className="block text-sm font-semibold"
                    >
                      Email
                    </label>

                    <input
                      id="edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(event) =>
                        setEditEmail(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>
              </div>

              {/* DELIVERY DETAILS */}

              <div>
                <h3 className="text-lg font-bold">
                  Delivery Details
                </h3>

                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="edit-address"
                      className="block text-sm font-semibold"
                    >
                      Delivery Address
                    </label>

                    <textarea
                      id="edit-address"
                      rows={3}
                      value={editAddress}
                      onChange={(event) =>
                        setEditAddress(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-map-pin"
                      className="block text-sm font-semibold"
                    >
                      Map Pin
                    </label>

                    <input
                      id="edit-map-pin"
                      type="text"
                      value={editMapPin}
                      onChange={(event) =>
                        setEditMapPin(
                          event.target.value
                        )
                      }
                      placeholder="Google Maps link (optional)"
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="edit-date"
                        className="block text-sm font-semibold"
                      >
                        Delivery Date
                      </label>

                      <input
                        id="edit-date"
                        type="date"
                        value={editDate}
                        onChange={(event) =>
                          setEditDate(
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-time"
                        className="block text-sm font-semibold"
                      >
                        Delivery Time
                      </label>

                      <input
                        id="edit-time"
                        type="text"
                        value={editTime}
                        onChange={(event) =>
                          setEditTime(
                            event.target.value
                          )
                        }
                        placeholder="7:00 PM"
                        className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-instructions"
                      className="block text-sm font-semibold"
                    >
                      Additional Instructions
                    </label>

                    <textarea
                      id="edit-instructions"
                      rows={3}
                      value={
                        editInstructions
                      }
                      onChange={(event) =>
                        setEditInstructions(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>
              </div>

              {/* PRICE */}

              <div>
                <h3 className="text-lg font-bold">
                  Price
                </h3>

                <div className="mt-4">
                  <label
                    htmlFor="edit-delivery-charge"
                    className="block text-sm font-semibold"
                  >
                    Delivery Charge
                  </label>

                  <input
                    id="edit-delivery-charge"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      editDeliveryCharge
                    }
                    onChange={(event) =>
                      setEditDeliveryCharge(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span>
                      Current Food Total
                    </span>

                    <span className="font-semibold">
                      {formatMoney(
                        editingOrder.foodTotal
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between">
                    <span>
                      New Delivery Charge
                    </span>

                    <span className="font-semibold">
                      {formatMoney(
                        Number(
                          editDeliveryCharge ||
                            0
                        )
                      )}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4 text-lg font-bold">
                    <span>
                      New Grand Total
                    </span>

                    <span className="text-orange-600">
                      {formatMoney(
                        Number(
                          editingOrder.foodTotal
                        ) +
                          Number(
                            editDeliveryCharge ||
                              0
                          )
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* WARNING */}

              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                <strong>
                  Important:
                </strong>{" "}
                Saving changes resets
                customer confirmation
                and admin confirmation.
                The customer must confirm
                the updated order again.
              </div>

              {/* SAVE */}

              <div className="flex flex-col gap-3 border-t border-zinc-100 pt-6 sm:flex-row">
                <button
                  type="submit"
                  disabled={
                    actionLoading ===
                    editingOrder._id
                  }
                  className="flex-1 rounded-full bg-orange-600 px-6 py-3.5 font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ===
                  editingOrder._id
                    ? "Saving..."
                    : "Save Order Changes"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditingOrder(
                      null
                    )
                  }
                  disabled={
                    actionLoading ===
                    editingOrder._id
                  }
                  className="rounded-full border border-zinc-200 px-6 py-3.5 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}