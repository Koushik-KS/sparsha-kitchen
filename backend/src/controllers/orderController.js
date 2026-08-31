const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Recipe = require("../models/Recipe");
require("../models/DeliveryPerson");

// ==========================================
// HELPERS
// ==========================================

// Generate customer-friendly order ID
const generateOrderId = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const randomNumber = Math.floor(1000 + Math.random() * 9000);

  return `SK-${year}${month}${day}-${randomNumber}`;
};

// Generate secure random token
const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// ==========================================
// CUSTOMER: CREATE ORDER
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
    } = req.body;

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (
      !customer ||
      !customer.name ||
      !customer.phone ||
      !deliveryAddress ||
      !requestedDeliveryDate ||
      !requestedDeliveryTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name, phone, address, delivery date and delivery time are required",
      });
    }

    // ==========================================
    // VALIDATE ITEMS
    // ==========================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one order item is required",
      });
    }

    const processedItems = [];
    let foodTotal = 0;

    // ==========================================
    // PROCESS EACH RECIPE
    // ==========================================

    for (const item of items) {
      if (!item.recipeId || !item.quantity) {
        return res.status(400).json({
          success: false,
          message:
            "Each order item requires recipeId and quantity",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.recipeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid recipe ID",
        });
      }

      const quantity = Number(item.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than zero",
        });
      }

      const recipe = await Recipe.findOne({
        _id: item.recipeId,
        isActive: true,
        isAvailable: true,
      });

      if (!recipe) {
        return res.status(400).json({
          success: false,
          message:
            "One or more selected recipes are unavailable",
        });
      }

      const pricePerUnit = Number(recipe.price);
      const totalPrice = quantity * pricePerUnit;

      foodTotal += totalPrice;

      processedItems.push({
        recipe: recipe._id,
        name: recipe.name,
        quantity,
        unit: recipe.unit,
        pricePerUnit,
        totalPrice,
        isCustomRecipe: false,
      });
    }

    // ==========================================
    // GENERATE TOKENS
    // ==========================================

    const trackingToken = generateToken();
    const confirmationToken = generateToken();

    // ==========================================
    // GENERATE UNIQUE ORDER ID
    // ==========================================

    let orderId;
    let existingOrder;

    do {
      orderId = generateOrderId();

      existingOrder = await Order.findOne({
        orderId,
      });
    } while (existingOrder);

    // ==========================================
    // CREATE ORDER
    // ==========================================

    const order = await Order.create({
      orderId,

      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email:
          customer.email?.trim().toLowerCase() || "",
      },

      deliveryAddress: deliveryAddress.trim(),

      mapPin: mapPin?.trim() || "",

      requestedDeliveryDate,

      requestedDeliveryTime:
        requestedDeliveryTime.trim(),

      additionalInstructions:
        additionalInstructions?.trim() || "",

      items: processedItems,

      foodTotal,

      deliveryCharge: 0,

      grandTotal: foodTotal,

      status: "PENDING_CONFIRMATION",

      customerConfirmed: false,

      customerConfirmedAt: null,

      adminConfirmed: false,

      adminConfirmedAt: null,

      changeRequested: false,

      changeRequestMessage: "",

      cancellationRequested: false,

      cancellationRequestMessage: "",

      statusHistory: [
        {
          status: "PENDING_CONFIRMATION",
          changedBy: "system",
          note:
            "Order request submitted by customer",
        },
      ],

      trackingToken,

      confirmationToken,

      confirmationTokenExpiresAt: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),

      confirmationTokenUsed: false,
    });

    return res.status(201).json({
      success: true,

      message:
        "Order request received. The admin will contact you for confirmation.",

      order: {
        id: order._id,
        orderId: order.orderId,
        status: order.status,
        foodTotal: order.foodTotal,
        grandTotal: order.grandTotal,
        trackingToken: order.trackingToken,
      },
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
        "items.recipe",
        "name photos price unit"
      )
      .populate(
        "deliveryPerson",
        "name phone whatsapp"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

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
        "items.recipe",
        "name photos price unit"
      )
      .populate(
        "deliveryPerson",
        "name phone whatsapp"
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
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: UPDATE ORDER
// ==========================================

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (
      ["CANCELLED", "DELIVERED"].includes(
        order.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Order cannot be edited when status is ${order.status}`,
      });
    }

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

    // ==========================================
    // CUSTOMER DETAILS
    // ==========================================

    if (customer) {
      if (customer.name !== undefined) {
        if (
          typeof customer.name !== "string" ||
          !customer.name.trim()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Customer name cannot be empty",
          });
        }

        order.customer.name =
          customer.name.trim();
      }

      if (customer.phone !== undefined) {
        if (
          typeof customer.phone !== "string" ||
          !customer.phone.trim()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Customer phone cannot be empty",
          });
        }

        order.customer.phone =
          customer.phone.trim();
      }

      if (customer.email !== undefined) {
        order.customer.email =
          String(customer.email)
            .trim()
            .toLowerCase();
      }
    }

    // ==========================================
    // DELIVERY DETAILS
    // ==========================================

    if (deliveryAddress !== undefined) {
      if (
        typeof deliveryAddress !== "string" ||
        !deliveryAddress.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery address cannot be empty",
        });
      }

      order.deliveryAddress =
        deliveryAddress.trim();
    }

    if (mapPin !== undefined) {
      order.mapPin =
        String(mapPin).trim();
    }

    if (requestedDeliveryDate !== undefined) {
      order.requestedDeliveryDate =
        requestedDeliveryDate;
    }

    if (requestedDeliveryTime !== undefined) {
      if (
        typeof requestedDeliveryTime !== "string" ||
        !requestedDeliveryTime.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Requested delivery time cannot be empty",
        });
      }

      order.requestedDeliveryTime =
        requestedDeliveryTime.trim();
    }

    if (additionalInstructions !== undefined) {
      order.additionalInstructions =
        String(additionalInstructions).trim();
    }

    // ==========================================
    // ORDER ITEMS
    // ==========================================

    if (items !== undefined) {
      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order must contain at least one item",
        });
      }

      const processedItems = [];
      let foodTotal = 0;

      for (const item of items) {
        if (
          !item.recipeId ||
          !item.quantity
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each item requires recipeId and quantity",
          });
        }

        if (
          !mongoose.Types.ObjectId.isValid(
            item.recipeId
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid recipe ID",
          });
        }

        const quantity =
          Number(item.quantity);

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Quantity must be greater than zero",
          });
        }

        const recipe =
          await Recipe.findById(
            item.recipeId
          );

        if (!recipe) {
          return res.status(404).json({
            success: false,
            message: "Recipe not found",
          });
        }

        const pricePerUnit =
          item.customPrice !== undefined
            ? Number(item.customPrice)
            : Number(recipe.price);

        if (
          !Number.isFinite(pricePerUnit) ||
          pricePerUnit < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid item price",
          });
        }

        const totalPrice =
          quantity * pricePerUnit;

        foodTotal += totalPrice;

        processedItems.push({
          recipe: recipe._id,
          name: recipe.name,
          quantity,
          unit:
            item.unit?.trim() ||
            recipe.unit,
          pricePerUnit,
          totalPrice,
          isCustomRecipe:
            Boolean(item.isCustomRecipe),
        });
      }

      order.items =
        processedItems;

      order.foodTotal =
        foodTotal;
    }

    // ==========================================
    // DELIVERY CHARGE
    // ==========================================

    if (deliveryCharge !== undefined) {
      const charge =
        Number(deliveryCharge);

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

      order.deliveryCharge =
        charge;
    }

    // ==========================================
    // TOTAL
    // ==========================================

    order.grandTotal =
      Number(order.foodTotal) +
      Number(order.deliveryCharge);

    // ==========================================
    // RESET CONFIRMATION
    // ==========================================

    order.customerConfirmed =
      false;

    order.customerConfirmedAt =
      null;

    order.adminConfirmed =
      false;

    order.adminConfirmedAt =
      null;

    order.confirmationToken =
      generateToken();

    order.confirmationTokenExpiresAt =
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000
      );

    order.confirmationTokenUsed =
      false;

    order.changeRequested =
      false;

    order.changeRequestMessage =
      "";

    order.status =
      "PENDING_CONFIRMATION";

    order.statusHistory.push({
      status:
        "PENDING_CONFIRMATION",
      changedBy: "admin",
      note:
        "Order details were updated by admin. Customer confirmation is required again.",
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Order updated successfully. Customer confirmation is required again.",
      order,
    });
  } catch (error) {
    console.error(
      "Update order error:",
      error
    );

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
    const { token } =
      req.params;

    if (!token) {
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
          "Invalid confirmation link",
      });
    }

    if (order.confirmationTokenUsed) {
      return res.status(400).json({
        success: false,
        message:
          "This confirmation link has already been used",
      });
    }

    if (
      !order.confirmationTokenExpiresAt ||
      order.confirmationTokenExpiresAt <
        new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This confirmation link has expired",
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

    order.customerConfirmed =
      true;

    order.customerConfirmedAt =
      new Date();

    order.confirmationTokenUsed =
      true;

    order.confirmationToken =
      null;

    order.confirmationTokenExpiresAt =
      null;

    order.status =
      "CUSTOMER_CONFIRMED";

    order.statusHistory.push({
      status:
        "CUSTOMER_CONFIRMED",
      changedBy:
        "customer",
      note:
        "Customer confirmed the order",
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Order confirmed by customer. Waiting for admin final confirmation.",
      order: {
        orderId:
          order.orderId,
        status:
          order.status,
        customerConfirmed:
          order.customerConfirmed,
        adminConfirmed:
          order.adminConfirmed,
        foodTotal:
          order.foodTotal,
        deliveryCharge:
          order.deliveryCharge,
        grandTotal:
          order.grandTotal,
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
    const { token } =
      req.params;

    const { message } =
      req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message:
          "Tracking token is required",
      });
    }

    if (
      !message ||
      !message.trim()
    ) {
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
          `Change request is not allowed when order status is ${order.status}`,
      });
    }

    order.changeRequested =
      true;

    order.changeRequestMessage =
      message.trim();

    order.statusHistory.push({
      status:
        order.status,
      changedBy:
        "customer",
      note:
        `Customer requested a change: ${message.trim()}`,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Your change request has been sent to Sparsha Kitchen. The admin will review it and contact you.",
      order: {
        orderId:
          order.orderId,
        status:
          order.status,
        changeRequested:
          order.changeRequested,
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
// ADMIN: FINAL CONFIRM ORDER
// ==========================================

const confirmOrderByAdmin = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
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

    if (!order.customerConfirmed) {
      return res.status(400).json({
        success: false,
        message:
          "Customer confirmation is required before admin can confirm the order",
      });
    }

    if (order.changeRequested) {
      return res.status(400).json({
        success: false,
        message:
          "Customer has requested a change. Update the order and get customer confirmation again.",
      });
    }

    if (
      order.adminConfirmed &&
      order.status === "CONFIRMED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order is already confirmed",
      });
    }

    order.adminConfirmed =
      true;

    order.adminConfirmedAt =
      new Date();

    order.status =
      "CONFIRMED";

    order.statusHistory.push({
      status:
        "CONFIRMED",
      changedBy:
        "admin",
      note:
        "Admin confirmed the order after customer confirmation",
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Order confirmed successfully. The order can now move to preparation.",
      order: {
        orderId:
          order.orderId,
        status:
          order.status,
        customerConfirmed:
          order.customerConfirmed,
        adminConfirmed:
          order.adminConfirmed,
        foodTotal:
          order.foodTotal,
        deliveryCharge:
          order.deliveryCharge,
        grandTotal:
          order.grandTotal,
      },
    });
  } catch (error) {
    console.error(
      "Admin confirm order error:",
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
    const { id } =
      req.params;

    const {
      status,
      note,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
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
        message:
          "Order not found",
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

    if (
      order.status ===
      "DELIVERED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivered orders cannot be changed",
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
      !nextStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot change order status from ${order.status} to ${status}`,
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

    return res.status(200).json({
      success: true,
      message:
        `Order status updated to ${status}`,
      order: {
        orderId:
          order.orderId,
        status:
          order.status,
        customerConfirmed:
          order.customerConfirmed,
        adminConfirmed:
          order.adminConfirmed,
        foodTotal:
          order.foodTotal,
        deliveryCharge:
          order.deliveryCharge,
        grandTotal:
          order.grandTotal,
      },
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
// CUSTOMER: TRACK ORDER BY TOKEN
// ==========================================

const trackOrderByToken = async (
  req,
  res
) => {
  try {
    const {
      trackingToken,
    } = req.params;

    if (!trackingToken) {
      return res.status(400).json({
        success: false,
        message:
          "Tracking token is required",
      });
    }

    const order =
      await Order.findOne({
        trackingToken,
      })
        .populate(
          "items.recipe",
          "name photos unit"
        )
        .populate(
          "deliveryPerson",
          "name phone whatsapp"
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

      order: {
        orderId:
          order.orderId,

        customer: {
          name:
            order.customer.name,
        },

        items:
          order.items,

        foodTotal:
          order.foodTotal,

        deliveryCharge:
          order.deliveryCharge,

        grandTotal:
          order.grandTotal,

        deliveryAddress:
          order.deliveryAddress,

        requestedDeliveryDate:
          order.requestedDeliveryDate,

        requestedDeliveryTime:
          order.requestedDeliveryTime,

        additionalInstructions:
          order.additionalInstructions,

        status:
          order.status,

        customerConfirmed:
          order.customerConfirmed,

        adminConfirmed:
          order.adminConfirmed,

        statusHistory:
          order.statusHistory,

        deliveryPerson:
          order.deliveryPerson
            ? {
                name:
                  order.deliveryPerson.name,
                phone:
                  order.deliveryPerson.phone,
                whatsapp:
                  order.deliveryPerson.whatsapp,
              }
            : null,

        createdAt:
          order.createdAt,

        updatedAt:
          order.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Track order error:",
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

      const cleanOrderId =
        orderId.trim();

      const cleanPhone =
        phone.trim();

      const order =
        await Order.findOne({
          orderId:
            cleanOrderId,
          "customer.phone":
            cleanPhone,
        })
          .populate(
            "items.recipe",
            "name photos unit"
          )
          .populate(
            "deliveryPerson",
            "name phone whatsapp"
          );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found. Please check your Order ID and phone number.",
        });
      }

      const deliveryPerson =
        order.status ===
          "OUT_FOR_DELIVERY" &&
        order.deliveryPerson
          ? {
              name:
                order.deliveryPerson.name,
              phone:
                order.deliveryPerson.phone,
              whatsapp:
                order.deliveryPerson.whatsapp,
            }
          : null;

      return res.status(200).json({
        success: true,

        order: {
          orderId:
            order.orderId,

          customer: {
            name:
              order.customer.name,
          },

          items:
            order.items,

          foodTotal:
            order.foodTotal,

          deliveryCharge:
            order.deliveryCharge,

          grandTotal:
            order.grandTotal,

          deliveryAddress:
            order.deliveryAddress,

          requestedDeliveryDate:
            order.requestedDeliveryDate,

          requestedDeliveryTime:
            order.requestedDeliveryTime,

          additionalInstructions:
            order.additionalInstructions,

          status:
            order.status,

          customerConfirmed:
            order.customerConfirmed,

          adminConfirmed:
            order.adminConfirmed,

          statusHistory:
            order.statusHistory,

          deliveryPerson,

          createdAt:
            order.createdAt,

          updatedAt:
            order.updatedAt,
        },
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
      const { token } =
        req.params;

      const { message } =
        req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message:
            "Tracking token is required",
        });
      }

      if (
        !message ||
        !message.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cancellation reason is required",
        });
      }

      const order =
        await Order.findOne({
          trackingToken:
            token,
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      if (
        order.status ===
        "DELIVERED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivered orders cannot be cancelled",
        });
      }

      if (
        order.status ===
        "CANCELLED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order is already cancelled",
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

      order.cancellationRequestMessage =
        message.trim();

      order.statusHistory.push({
        status:
          order.status,
        changedBy:
          "customer",
        note:
          `Customer requested cancellation: ${message.trim()}`,
      });

      await order.save();

      return res.status(200).json({
        success: true,
        message:
          "Cancellation request sent to Sparsha Kitchen. The admin will review your request.",
        order: {
          orderId:
            order.orderId,
          status:
            order.status,
          cancellationRequested:
            order.cancellationRequested,
        },
      });
    } catch (error) {
      console.error(
        "Request cancellation error:",
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
      const { id } =
        req.params;

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
        !["APPROVE", "REJECT"].includes(
          action
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Action must be APPROVE or REJECT",
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
            "No cancellation request exists for this order",
        });
      }

      if (
        order.status ===
        "DELIVERED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivered orders cannot be cancelled",
        });
      }

      // ==========================================
      // APPROVE
      // ==========================================

      if (action === "APPROVE") {
        order.status =
          "CANCELLED";

        order.cancellationRequested =
          false;

        order.statusHistory.push({
          status:
            "CANCELLED",
          changedBy:
            "admin",
          note:
            note?.trim() ||
            "Admin approved the customer's cancellation request",
        });

        await order.save();

        return res.status(200).json({
          success: true,
          message:
            "Cancellation approved. Order has been cancelled.",
          order: {
            orderId:
              order.orderId,
            status:
              order.status,
            cancellationRequested:
              order.cancellationRequested,
          },
        });
      }

      // ==========================================
      // REJECT
      // ==========================================

      order.cancellationRequested =
        false;

      order.cancellationRequestMessage =
        "";

      order.statusHistory.push({
        status:
          order.status,
        changedBy:
          "admin",
        note:
          note?.trim() ||
          "Admin rejected the customer's cancellation request",
      });

      await order.save();

      return res.status(200).json({
        success: true,
        message:
          "Cancellation request rejected. Order will continue.",
        order: {
          orderId:
            order.orderId,
          status:
            order.status,
          cancellationRequested:
            order.cancellationRequested,
        },
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
// EXPORTS
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
};