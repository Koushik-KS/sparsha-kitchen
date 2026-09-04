const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Recipe = require("../models/Recipe");

require("../models/DeliveryPerson");

// ==========================================
// CREATE ORDER
// ==========================================

const createOrder = async (req, res) => {
  try {
    const {
      customer,
      deliveryAddress,
      mapPin,
      requestedDeliveryDate,
      requestedDeliveryTime,
      additionalInstructions,
      items,
      deliveryCharge = 0,
    } = req.body;

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone are required",
      });
    }

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    if (!requestedDeliveryDate || !requestedDeliveryTime) {
      return res.status(400).json({
        success: false,
        message: "Requested delivery date and time are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one order item is required",
      });
    }

    const orderItems = [];
    let foodTotal = 0;

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid item quantity",
        });
      }

      // CUSTOM RECIPE
      if (item.isCustomRecipe) {
        const price = Number(item.customPrice);

        if (!Number.isFinite(price) || price < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid custom recipe price",
          });
        }

        const totalPrice = price * item.quantity;

        foodTotal += totalPrice;

        orderItems.push({
          name: item.name || "Custom Recipe",
          quantity: item.quantity,
          unit: item.unit || "serving",
          pricePerUnit: price,
          totalPrice,
          isCustomRecipe: true,
        });

        continue;
      }

      // REGULAR RECIPE
      if (!item.recipeId) {
        return res.status(400).json({
          success: false,
          message: "Recipe ID is required for regular recipe items",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.recipeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid recipe ID",
        });
      }

      const recipe = await Recipe.findOne({
        _id: item.recipeId,
        isActive: true,
        isAvailable: true,
      });

      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: "Recipe not found or unavailable",
        });
      }

      const quantity = Number(item.quantity);
      const totalPrice = recipe.price * quantity;

      foodTotal += totalPrice;

      orderItems.push({
        recipe: recipe._id,
        name: recipe.name,
        quantity,
        unit: item.unit || recipe.unit,
        pricePerUnit: recipe.price,
        totalPrice,
        isCustomRecipe: false,
      });
    }

    const finalDeliveryCharge = Number(deliveryCharge);

    if (
      !Number.isFinite(finalDeliveryCharge) ||
      finalDeliveryCharge < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery charge",
      });
    }

    const grandTotal = foodTotal + finalDeliveryCharge;

    // ==========================================
    // GENERATE CUSTOMER-FACING ORDER ID
    // ==========================================

    const orderId = `SK-${Date.now()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const trackingToken = crypto
      .randomBytes(24)
      .toString("hex");

    const confirmationToken = crypto
      .randomBytes(24)
      .toString("hex");

    const confirmationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    const order = await Order.create({
      orderId,

      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email?.trim().toLowerCase() || "",
      },

      deliveryAddress: deliveryAddress.trim(),

      mapPin: mapPin?.trim() || "",

      requestedDeliveryDate,
      requestedDeliveryTime,

      additionalInstructions:
        additionalInstructions?.trim() || "",

      items: orderItems,

      foodTotal,

      deliveryCharge: finalDeliveryCharge,

      grandTotal,

      paymentStatus: "UNPAID",

      paidAmount: 0,

      paymentHistory: [],

      deliveryOtpHash: null,

      deliveryOtpExpiresAt: null,

      deliveryOtpVerified: false,

      deliveryOtpVerifiedAt: null,

      trackingToken,

      confirmationToken,

      confirmationTokenExpiresAt,

      status: "PENDING_CONFIRMATION",

      customerConfirmed: false,

      adminConfirmed: false,

      changeRequested: false,

      cancellationRequested: false,

      statusHistory: [
        {
          status: "PENDING_CONFIRMATION",
          changedBy: "system",
          note:
            "Order created and waiting for customer confirmation",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: GET ALL ORDERS
// ==========================================

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate(
        "deliveryPerson",
        "name phone whatsapp"
      )
      .populate(
        "items.recipe",
        "name photos price unit"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: GET ONE ORDER
// ==========================================

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id)
      .populate(
        "deliveryPerson",
        "name phone whatsapp"
      )
      .populate(
        "items.recipe",
        "name photos price unit"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: UPDATE ORDER DETAILS
// ==========================================

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      customer,
      deliveryAddress,
      mapPin,
      requestedDeliveryDate,
      requestedDeliveryTime,
      additionalInstructions,
      items,
      deliveryCharge,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (["DELIVERED", "CANCELLED"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Delivered or cancelled orders cannot be edited",
      });
    }

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone are required",
      });
    }

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    if (!requestedDeliveryDate || !requestedDeliveryTime) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery date and time are required",
      });
    }

    order.customer = {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      email:
        customer.email?.trim().toLowerCase() || "",
    };

    order.deliveryAddress =
      deliveryAddress.trim();

    order.mapPin =
      mapPin?.trim() || "";

    order.requestedDeliveryDate =
      requestedDeliveryDate;

    order.requestedDeliveryTime =
      requestedDeliveryTime;

    order.additionalInstructions =
      additionalInstructions?.trim() || "";

    if (Array.isArray(items)) {
      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Order must contain at least one item",
        });
      }

      const updatedItems = [];
      let foodTotal = 0;

      for (const item of items) {
        const quantity = Number(item.quantity);

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid item quantity",
          });
        }

        if (item.isCustomRecipe) {
          const customPrice =
            Number(item.customPrice);

          if (
            !Number.isFinite(customPrice) ||
            customPrice < 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid custom recipe price",
            });
          }

          const totalPrice =
            customPrice * quantity;

          foodTotal += totalPrice;

          updatedItems.push({
            name:
              item.name ||
              "Custom Recipe",
            quantity,
            unit:
              item.unit ||
              "serving",
            pricePerUnit:
              customPrice,
            totalPrice,
            isCustomRecipe: true,
          });

          continue;
        }

        if (!item.recipeId) {
          return res.status(400).json({
            success: false,
            message:
              "Recipe ID is required",
          });
        }

        if (
          !mongoose.Types.ObjectId.isValid(
            item.recipeId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid recipe ID",
          });
        }

        const recipe =
          await Recipe.findOne({
            _id: item.recipeId,
            isActive: true,
            isAvailable: true,
          });

        if (!recipe) {
          return res.status(404).json({
            success: false,
            message:
              "Recipe not found or unavailable",
          });
        }

        const totalPrice =
          recipe.price * quantity;

        foodTotal += totalPrice;

        updatedItems.push({
          recipe: recipe._id,
          name: recipe.name,
          quantity,
          unit:
            item.unit ||
            recipe.unit,
          pricePerUnit:
            recipe.price,
          totalPrice,
          isCustomRecipe: false,
        });
      }

      order.items = updatedItems;
      order.foodTotal = foodTotal;
    }

    if (deliveryCharge !== undefined) {
      const charge = Number(deliveryCharge);

      if (
        !Number.isFinite(charge) ||
        charge < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid delivery charge",
        });
      }

      order.deliveryCharge = charge;
    }

    order.grandTotal =
      Number(order.foodTotal) +
      Number(order.deliveryCharge);

    order.customerConfirmed = false;
    order.customerConfirmedAt = null;

    order.adminConfirmed = false;
    order.adminConfirmedAt = null;

    order.changeRequested = false;
    order.changeRequestMessage = "";

    order.confirmationToken =
      crypto
        .randomBytes(24)
        .toString("hex");

    order.confirmationTokenExpiresAt =
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000
      );

    order.status =
      "PENDING_CONFIRMATION";

    order.statusHistory.push({
      status:
        "PENDING_CONFIRMATION",
      changedBy: "admin",
      note:
        "Order details were edited by admin. Customer confirmation is required again.",
    });

    await order.save();

    await order.populate(
      "deliveryPerson",
      "name phone whatsapp"
    );

    await order.populate(
      "items.recipe",
      "name photos price unit"
    );

    return res.status(200).json({
      success: true,
      message:
        "Order updated successfully. Customer confirmation is required again.",
      order,
    });
  } catch (error) {
    console.error("Update order error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// CUSTOMER: CONFIRM ORDER
// ==========================================

const confirmOrderByCustomer = async (
  req,
  res
) => {
  try {
    const { token } = req.params;

    if (!token || !token.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Confirmation token is required",
      });
    }

    const order =
      await Order.findOne({
        confirmationToken: token,
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid or expired confirmation token",
      });
    }

    if (
      order.confirmationTokenExpiresAt &&
      new Date() >
        new Date(
          order.confirmationTokenExpiresAt
        )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Confirmation token has expired. Please ask admin to update/save the order again.",
      });
    }

    if (order.customerConfirmed) {
      return res.status(400).json({
        success: false,
        message:
          "Order has already been confirmed by customer",
      });
    }

    if (
      ["CANCELLED", "DELIVERED"].includes(
        order.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Order cannot be confirmed when status is ${order.status}`,
      });
    }

    order.customerConfirmed = true;
    order.customerConfirmedAt = new Date();

    order.status =
      "CUSTOMER_CONFIRMED";

    order.statusHistory.push({
      status:
        "CUSTOMER_CONFIRMED",
      changedBy: "customer",
      note:
        "Customer confirmed the order",
    });

    order.confirmationToken = null;
    order.confirmationTokenExpiresAt = null;

    await order.save();

    await order.populate(
      "deliveryPerson",
      "name phone whatsapp"
    );

    return res.status(200).json({
      success: true,
      message:
        "Order confirmed successfully",
      order: {
        orderId:
          order.orderId,
        status:
          order.status,
        customerConfirmed:
          order.customerConfirmed,
        customerConfirmedAt:
          order.customerConfirmedAt,
        adminConfirmed:
          order.adminConfirmed,
        deliveryPerson:
          order.deliveryPerson,
        foodTotal:
          order.foodTotal,
        deliveryCharge:
          order.deliveryCharge,
        grandTotal:
          order.grandTotal,
        paymentStatus:
          order.paymentStatus,
        paidAmount:
          order.paidAmount,
        trackingToken:
          order.trackingToken,
      },
    });
  } catch (error) {
    console.error(
      "Customer confirmation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// CUSTOMER: REQUEST ORDER CHANGE
// ==========================================

const requestOrderChange = async (
  req,
  res
) => {
  try {
    const { token } = req.params;
    const { message } = req.body;

    if (!token || !token.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Tracking token is required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Change request message is required",
      });
    }

    const order =
      await Order.findOne({
        trackingToken: token,
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      ["DELIVERED", "CANCELLED"].includes(
        order.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Changes cannot be requested when order status is ${order.status}`,
      });
    }

    order.changeRequested = true;

    order.changeRequestMessage =
      message.trim();

    order.statusHistory.push({
      status: order.status,
      changedBy: "customer",
      note:
        `Customer requested an order change: ${message.trim()}`,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Change request sent to admin successfully",
      order: {
        orderId:
          order.orderId,
        status:
          order.status,
        changeRequested:
          order.changeRequested,
        changeRequestMessage:
          order.changeRequestMessage,
      },
    });
  } catch (error) {
    console.error(
      "Request order change error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: CONFIRM ORDER
// ==========================================

const confirmOrderByAdmin = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order =
      await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.customerConfirmed) {
      return res.status(400).json({
        success: false,
        message:
          "Customer must confirm the order before admin confirmation",
      });
    }

    if (order.changeRequested) {
      return res.status(400).json({
        success: false,
        message:
          "Order has a pending customer change request",
      });
    }

    if (order.adminConfirmed) {
      return res.status(400).json({
        success: false,
        message:
          "Order has already been confirmed by admin",
      });
    }

    if (
      ["CANCELLED", "DELIVERED"].includes(
        order.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Order cannot be confirmed when status is ${order.status}`,
      });
    }

    order.adminConfirmed = true;
    order.adminConfirmedAt = new Date();

    order.status =
      "CONFIRMED";

    order.statusHistory.push({
      status:
        "CONFIRMED",
      changedBy: "admin",
      note:
        "Admin confirmed the customer order",
    });

    await order.save();

    await order.populate(
      "deliveryPerson",
      "name phone whatsapp"
    );

    return res.status(200).json({
      success: true,
      message:
        "Order confirmed by admin successfully",
      order: {
        orderId:
          order.orderId,
        status:
          order.status,
        customerConfirmed:
          order.customerConfirmed,
        adminConfirmed:
          order.adminConfirmed,
        deliveryPerson:
          order.deliveryPerson,
        foodTotal:
          order.foodTotal,
        deliveryCharge:
          order.deliveryCharge,
        grandTotal:
          order.grandTotal,
        paymentStatus:
          order.paymentStatus,
        paidAmount:
          order.paidAmount,
        trackingToken:
          order.trackingToken,
      },
    });
  } catch (error) {
    console.error(
      "Admin confirmation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: ADD PAYMENT
// ==========================================

const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount must be greater than 0",
      });
    }

    const allowedMethods = [
      "UPI",
      "CASH",
      "BANK_TRANSFER",
      "OTHER",
    ];

    if (!allowedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment method",
      });
    }

    const order =
      await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message:
          "Payment cannot be added to a cancelled order",
      });
    }

    const currentPaidAmount =
      Number(order.paidAmount || 0);

    const grandTotal =
      Number(order.grandTotal || 0);

    const remainingAmount =
      grandTotal -
      currentPaidAmount;

    if (remainingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "This order is already fully paid",
      });
    }

    if (paymentAmount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message:
          `Payment cannot exceed remaining amount of ₹${remainingAmount.toFixed(
            2
          )}`,
      });
    }

    order.paymentHistory.push({
      amount: paymentAmount,
      method,
      recordedAt: new Date(),
      recordedBy:
        req.admin?.email || "admin",
      note:
        note?.trim() || "",
    });

    order.paidAmount =
      currentPaidAmount +
      paymentAmount;

    if (
      order.paidAmount >=
      grandTotal
    ) {
      order.paidAmount =
        grandTotal;

      order.paymentStatus =
        "PAID";
    } else if (
      order.paidAmount > 0
    ) {
      order.paymentStatus =
        "PARTIALLY_PAID";
    } else {
      order.paymentStatus =
        "UNPAID";
    }

    order.statusHistory.push({
      status:
        order.status,
      changedBy:
        "admin",
      note:
        `Payment recorded: ₹${paymentAmount.toFixed(
          2
        )} via ${method}`,
    });

    await order.save();

    await order.populate(
      "deliveryPerson",
      "name phone whatsapp"
    );

    await order.populate(
      "items.recipe",
      "name photos price unit"
    );

    return res.status(200).json({
      success: true,
      message:
        "Payment added successfully",
      order,
      payment: {
        amount:
          paymentAmount,
        method,
        paidAmount:
          order.paidAmount,
        remainingAmount:
          Math.max(
            0,
            grandTotal -
              order.paidAmount
          ),
        paymentStatus:
          order.paymentStatus,
      },
    });
  } catch (error) {
    console.error(
      "Add payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: UPDATE ORDER STATUS
// ==========================================

const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const allowedStatuses = [
      "PREPARING",
      "READY",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    if (
      !status ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status",
      });
    }

    const order =
      await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      !order.adminConfirmed ||
      order.status ===
        "PENDING_CONFIRMATION"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order must be confirmed by admin before updating its status",
      });
    }

    if (order.status === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message:
          "Delivered orders cannot be changed",
      });
    }

    if (
      !order.deliveryPerson &&
      [
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please assign a delivery person before continuing the order.",
      });
    }

    const validTransitions = {
      CONFIRMED: [
        "PREPARING",
      ],

      PREPARING: [
        "READY",
      ],

      READY: [
        "OUT_FOR_DELIVERY",
      ],

      OUT_FOR_DELIVERY: [
        "DELIVERED",
      ],
    };

    const nextStatuses =
      validTransitions[
        order.status
      ] || [];

    if (
      !nextStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot change order status from ${order.status} to ${status}`,
      });
    }

    // ==========================================
    // DELIVERED REQUIREMENTS
    // ==========================================

    if (status === "DELIVERED") {
      if (
        !order.deliveryOtpVerified
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery OTP must be verified before marking the order delivered.",
        });
      }

      if (
        Number(order.paidAmount || 0) <
        Number(order.grandTotal || 0)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Remaining payment must be confirmed before marking the order delivered.",
        });
      }
    }

    // ==========================================
    // GENERATE DELIVERY OTP
    // ==========================================

    if (
      status ===
      "OUT_FOR_DELIVERY"
    ) {
      const otp =
        crypto
          .randomInt(
            100000,
            1000000
          )
          .toString();

      order.deliveryOtpHash =
        crypto
          .createHash("sha256")
          .update(otp)
          .digest("hex");

      order.deliveryOtpExpiresAt =
        new Date(
          Date.now() +
            24 * 60 * 60 * 1000
        );

      order.deliveryOtpVerified =
        false;

      order.deliveryOtpVerifiedAt =
        null;

      order.statusHistory.push({
        status:
          "OUT_FOR_DELIVERY",
        changedBy:
          "system",
        note:
          "Delivery OTP generated for customer",
      });

      order.status =
        "OUT_FOR_DELIVERY";

      order.statusHistory.push({
        status:
          "OUT_FOR_DELIVERY",
        changedBy:
          "admin",
        note:
          note?.trim() ||
          "Order sent out for delivery",
      });

      await order.save();

      await order.populate(
        "deliveryPerson",
        "name phone whatsapp"
      );

      return res.status(200).json({
        success: true,
        message:
          "Order is out for delivery. Delivery OTP has been generated.",
        order,
        deliveryOtpGenerated:
          true,
      });
    }

    const previousStatus =
      order.status;

    order.status =
      status;

    order.statusHistory.push({
      status,
      changedBy:
        "admin",
      note:
        note?.trim() ||
        `Order status changed from ${previousStatus} to ${status}`,
    });

    await order.save();

    await order.populate(
      "deliveryPerson",
      "name phone whatsapp"
    );

    return res.status(200).json({
      success: true,
      message:
        `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: VERIFY DELIVERY OTP
// ==========================================

const verifyDeliveryOtp = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery OTP is required",
      });
    }

    const order =
      await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    if (
      order.status !==
      "OUT_FOR_DELIVERY"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery OTP can only be verified when the order is out for delivery.",
      });
    }

    if (
      order.deliveryOtpVerified
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery OTP has already been verified.",
      });
    }

    if (
      !order.deliveryOtpHash ||
      !order.deliveryOtpExpiresAt
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery OTP is not available.",
      });
    }

    if (
      new Date() >
      new Date(
        order.deliveryOtpExpiresAt
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery OTP has expired.",
      });
    }

    const submittedHash =
      crypto
        .createHash("sha256")
        .update(
          String(otp).trim()
        )
        .digest("hex");

    if (
      submittedHash !==
      order.deliveryOtpHash
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incorrect delivery OTP.",
      });
    }

    order.deliveryOtpVerified =
      true;

    order.deliveryOtpVerifiedAt =
      new Date();

    order.deliveryOtpHash =
      null;

    order.deliveryOtpExpiresAt =
      null;

    order.statusHistory.push({
      status:
        order.status,
      changedBy:
        "admin",
      note:
        "Delivery OTP verified successfully",
    });

    await order.save();

    await order.populate(
      "deliveryPerson",
      "name phone whatsapp"
    );

    return res.status(200).json({
      success: true,
      message:
        "Delivery OTP verified successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "Verify delivery OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// CUSTOMER: TRACK ORDER BY TRACKING TOKEN
// ==========================================

const trackOrderByToken = async (
  req,
  res
) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message:
          "Tracking token is required",
      });
    }

    const order =
      await Order.findOne({
        trackingToken: token,
      })
        .populate(
          "deliveryPerson",
          "name phone whatsapp"
        )
        .populate(
          "items.recipe",
          "name photos price unit"
        );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Track order by token error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// CUSTOMER: TRACK ORDER BY ORDER ID + PHONE
// ==========================================

const trackOrderByOrderIdAndPhone =
  async (req, res) => {
    try {
      // IMPORTANT:
      // Frontend uses GET /orders/track?orderId=...&phone=...
      // Therefore these values come from req.query, NOT req.body.
      const {
        orderId,
        phone,
      } = req.query;

      if (!orderId || !phone) {
        return res.status(400).json({
          success: false,
          message:
            "Order ID and phone number are required",
        });
      }

      const normalizedPhone =
        String(phone).trim();

      const order =
        await Order.findOne({
          orderId:
            String(orderId).trim(),
          "customer.phone":
            normalizedPhone,
        })
          .populate(
            "deliveryPerson",
            "name phone whatsapp"
          )
          .populate(
            "items.recipe",
            "name photos price unit"
          );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found. Please check your order ID and phone number.",
        });
      }

      return res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      console.error(
        "Track order by order ID and phone error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

// ==========================================
// CUSTOMER: REQUEST ORDER CANCELLATION
// ==========================================

const requestOrderCancellation =
  async (req, res) => {
    try {
      const { token } = req.params;
      const { message } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message:
            "Tracking token is required",
        });
      }

      const order =
        await Order.findOne({
          trackingToken: token,
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      if (
        ["CANCELLED", "DELIVERED"].includes(
          order.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Order cannot be cancelled when status is ${order.status}`,
        });
      }

      if (
        order.status ===
        "OUT_FOR_DELIVERY"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order cannot be cancelled after it is out for delivery",
        });
      }

      if (
        order.cancellationRequested
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cancellation request has already been submitted",
        });
      }

      order.cancellationRequested =
        true;

      order.cancellationRequestedAt =
        new Date();

      order.cancellationMessage =
        message?.trim() || "";

      order.statusHistory.push({
        status:
          order.status,
        changedBy:
          "customer",
        note:
          message?.trim()
            ? `Cancellation requested: ${message.trim()}`
            : "Customer requested order cancellation",
      });

      await order.save();

      return res.status(200).json({
        success: true,
        message:
          "Cancellation request submitted successfully",
        order: {
          orderId:
            order.orderId,
          status:
            order.status,
          cancellationRequested:
            order.cancellationRequested,
          cancellationMessage:
            order.cancellationMessage,
        },
      });
    } catch (error) {
      console.error(
        "Request order cancellation error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

// ==========================================
// ADMIN: HANDLE CANCELLATION REQUEST
// ==========================================

const handleCancellationRequest =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        action,
        note,
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID",
        });
      }

      if (
        !["approve", "reject"].includes(
          action
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Action must be approve or reject",
        });
      }

      const order =
        await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      if (
        !order.cancellationRequested
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No cancellation request is pending",
        });
      }

      if (
        ["CANCELLED", "DELIVERED"].includes(
          order.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Order cannot be changed when status is ${order.status}`,
        });
      }

      if (action === "approve") {
        order.status =
          "CANCELLED";

        order.cancellationRequested =
          false;

        order.cancellationApproved =
          true;

        order.cancellationApprovedAt =
          new Date();

        order.statusHistory.push({
          status:
            "CANCELLED",
          changedBy:
            "admin",
          note:
            note?.trim() ||
            "Admin approved customer cancellation request",
        });
      }

      if (action === "reject") {
        order.cancellationRequested =
          false;

        order.cancellationApproved =
          false;

        order.cancellationRejectedAt =
          new Date();

        order.statusHistory.push({
          status:
            order.status,
          changedBy:
            "admin",
          note:
            note?.trim() ||
            "Admin rejected customer cancellation request",
        });
      }

      await order.save();

      await order.populate(
        "deliveryPerson",
        "name phone whatsapp"
      );

      await order.populate(
        "items.recipe",
        "name photos price unit"
      );

      return res.status(200).json({
        success: true,
        message:
          action === "approve"
            ? "Cancellation approved successfully"
            : "Cancellation request rejected successfully",
        order,
      });
    } catch (error) {
      console.error(
        "Handle cancellation request error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

  // ==========================================
// ADMIN: CANCEL ORDER DIRECTLY
// ==========================================

const cancelOrderByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    if (order.status === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be cancelled",
      });
    }

    if (order.status === "OUT_FOR_DELIVERY") {
      return res.status(400).json({
        success: false,
        message:
          "Order cannot be cancelled after it is out for delivery",
      });
    }

    order.status = "CANCELLED";

    order.cancellationRequested = false;
    order.cancellationApproved = true;
    order.cancellationApprovedAt = new Date();

    order.statusHistory.push({
      status: "CANCELLED",
      changedBy: "admin",
      note:
        note?.trim() ||
        "Order cancelled directly by admin",
    });

    await order.save();

    await order.populate(
      "deliveryPerson",
      "name phone whatsapp"
    );

    await order.populate(
      "items.recipe",
      "name photos price unit"
    );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Admin cancel order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to cancel order",
    });
  }
};

// ==========================================
// ADMIN: DELETE ORDER
// ==========================================

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    await Order.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Order deleted permanently.",
    });
  } catch (error) {
    console.error("Delete order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete order.",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  confirmOrderByCustomer,
  requestOrderChange,
  confirmOrderByAdmin,
  updateOrderStatus,
  trackOrderByToken,
  trackOrderByOrderIdAndPhone,
  requestOrderCancellation,
  handleCancellationRequest,
  cancelOrderByAdmin,
  addPayment,
  verifyDeliveryOtp,
  deleteOrder,
};