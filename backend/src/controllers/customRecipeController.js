const crypto = require("crypto");
const mongoose = require("mongoose");

const CustomRecipe = require("../models/CustomRecipe");
const Order = require("../models/Order");

// ==========================================
// HELPERS
// ==========================================

// Generate customer-friendly order ID
const generateOrderId = () => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );

  const day = String(date.getDate()).padStart(
    2,
    "0"
  );

  const randomNumber = Math.floor(
    1000 + Math.random() * 9000
  );

  return `SK-${year}${month}${day}-${randomNumber}`;
};

// ==========================================
// GENERATE SECURE TOKEN
// ==========================================

const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// ==========================================
// CUSTOMER: CREATE CUSTOM RECIPE REQUEST
// ==========================================

const createCustomRecipeRequest = async (req, res) => {
  try {
    const {
      customer,
      recipeName,
      description,
      quantity,
      unit,
      preferredDeliveryDate,
      preferredDeliveryTime,
      additionalInstructions,
    } = req.body;

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (
      !customer ||
      !customer.name ||
      !customer.phone ||
      !recipeName ||
      !description ||
      !quantity ||
      !unit ||
      !preferredDeliveryDate ||
      !preferredDeliveryTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name, phone, recipe name, description, quantity, unit, delivery date and delivery time are required",
      });
    }

    // ==========================================
    // QUANTITY VALIDATION
    // ==========================================

    const parsedQuantity = Number(quantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero",
      });
    }

    // ==========================================
    // CREATE CUSTOM RECIPE REQUEST
    // ==========================================

    const customRecipe =
      await CustomRecipe.create({
        customer: {
          name: customer.name.trim(),

          phone: customer.phone.trim(),

          email:
            customer.email?.trim().toLowerCase() || "",
        },

        recipeName: recipeName.trim(),

        description: description.trim(),

        quantity: parsedQuantity,

        unit: unit.trim(),

        preferredDeliveryDate:
          preferredDeliveryDate.trim(),

        preferredDeliveryTime:
          preferredDeliveryTime.trim(),

        additionalInstructions:
          additionalInstructions?.trim() || "",

        status: "PENDING",

        adminNote: "",

        quotedPrice: 0,

        order: null,
      });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,

      message:
        "Custom recipe request received. Sparsha Kitchen will contact you shortly.",

      customRecipe: {
        id: customRecipe._id,

        recipeName:
          customRecipe.recipeName,

        status:
          customRecipe.status,

        createdAt:
          customRecipe.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Create custom recipe request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: GET ALL CUSTOM RECIPE REQUESTS
// ==========================================

const getAllCustomRecipeRequests = async (
  req,
  res
) => {
  try {
    const requests =
      await CustomRecipe.find()
        .populate("order")
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error(
      "Get custom recipe requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: GET ONE CUSTOM RECIPE REQUEST
// ==========================================

const getCustomRecipeRequestById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid custom recipe request ID",
      });
    }

    // ==========================================
    // FIND REQUEST
    // ==========================================

    const request =
      await CustomRecipe.findById(id)
        .populate("order");

    if (!request) {
      return res.status(404).json({
        success: false,
        message:
          "Custom recipe request not found",
      });
    }

    return res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    console.error(
      "Get custom recipe request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: UPDATE CUSTOM RECIPE REQUEST
// ==========================================

const updateCustomRecipeRequest = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid custom recipe request ID",
      });
    }

    // ==========================================
    // FIND REQUEST
    // ==========================================

    const request =
      await CustomRecipe.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message:
          "Custom recipe request not found",
      });
    }

    const {
      status,
      adminNote,
      quotedPrice,
    } = req.body;

    // ==========================================
    // STATUS
    // ==========================================

    if (status !== undefined) {
      const allowedStatuses = [
        "PENDING",
        "CONTACTED",
        "QUOTED",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid custom recipe status",
        });
      }

      request.status = status;
    }

    // ==========================================
    // ADMIN NOTE
    // ==========================================

    if (adminNote !== undefined) {
      request.adminNote =
        String(adminNote).trim();
    }

    // ==========================================
    // QUOTED PRICE
    // ==========================================

    if (quotedPrice !== undefined) {
      const price = Number(quotedPrice);

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid quoted price",
        });
      }

      request.quotedPrice = price;
    }

    // ==========================================
    // SAVE
    // ==========================================

    await request.save();

    return res.status(200).json({
      success: true,

      message:
        "Custom recipe request updated successfully",

      request,
    });
  } catch (error) {
    console.error(
      "Update custom recipe request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// CUSTOMER: ACCEPT CUSTOM RECIPE QUOTE
// ==========================================

const acceptCustomRecipeQuote = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid custom recipe request ID",
      });
    }

    // ==========================================
    // FIND REQUEST
    // ==========================================

    const request =
      await CustomRecipe.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message:
          "Custom recipe request not found",
      });
    }

    // ==========================================
    // MUST BE QUOTED
    // ==========================================

    if (request.status !== "QUOTED") {
      return res.status(400).json({
        success: false,
        message:
          "Only a quoted custom recipe can be accepted",
      });
    }

    // ==========================================
    // VALIDATE PRICE
    // ==========================================

    if (
      !Number.isFinite(
        Number(request.quotedPrice)
      ) ||
      Number(request.quotedPrice) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid quoted price is required",
      });
    }

    // ==========================================
    // APPROVE QUOTE
    // ==========================================

    request.status = "APPROVED";

    await request.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      message:
        "Custom recipe quote accepted successfully",

      customRecipe: {
        id: request._id,

        recipeName:
          request.recipeName,

        status:
          request.status,

        quotedPrice:
          request.quotedPrice,
      },
    });
  } catch (error) {
    console.error(
      "Accept custom recipe quote error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// CUSTOMER: REJECT CUSTOM RECIPE QUOTE
// ==========================================

const rejectCustomRecipeQuote = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid custom recipe request ID",
      });
    }

    // ==========================================
    // FIND REQUEST
    // ==========================================

    const request =
      await CustomRecipe.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message:
          "Custom recipe request not found",
      });
    }

    // ==========================================
    // MUST BE QUOTED
    // ==========================================

    if (request.status !== "QUOTED") {
      return res.status(400).json({
        success: false,
        message:
          "Only a quoted custom recipe can be rejected",
      });
    }

    // ==========================================
    // REJECT QUOTE
    // ==========================================

    request.status = "REJECTED";

    await request.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      message:
        "Custom recipe quote rejected successfully",

      customRecipe: {
        id: request._id,

        recipeName:
          request.recipeName,

        status:
          request.status,
      },
    });
  } catch (error) {
    console.error(
      "Reject custom recipe quote error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// CUSTOMER: CREATE ORDER FROM APPROVED
// CUSTOM RECIPE
// ==========================================

const createOrderFromCustomRecipe = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      deliveryAddress,
      mapPin,
    } = req.body;

    // ==========================================
    // VALIDATE CUSTOM RECIPE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid custom recipe request ID",
      });
    }

    // ==========================================
    // VALIDATE DELIVERY ADDRESS
    // ==========================================

    if (
      !deliveryAddress ||
      typeof deliveryAddress !== "string" ||
      !deliveryAddress.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery address is required to create the order",
      });
    }

    // ==========================================
    // FIND CUSTOM RECIPE
    // ==========================================

    const customRecipe =
      await CustomRecipe.findById(id);

    if (!customRecipe) {
      return res.status(404).json({
        success: false,
        message:
          "Custom recipe request not found",
      });
    }

    // ==========================================
    // MUST BE APPROVED
    // ==========================================

    if (customRecipe.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message:
          "Custom recipe must be approved before creating an order",
      });
    }

    // ==========================================
    // PREVENT DUPLICATE ORDER
    // ==========================================

    if (customRecipe.order) {
      return res.status(400).json({
        success: false,
        message:
          "An order has already been created for this custom recipe",

        orderId:
          customRecipe.order,
      });
    }

    // ==========================================
    // VALIDATE QUOTED PRICE
    // ==========================================

    const quotedPrice =
      Number(customRecipe.quotedPrice);

    if (
      !Number.isFinite(quotedPrice) ||
      quotedPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid quoted price is required before creating an order",
      });
    }

    // ==========================================
    // VALIDATE QUANTITY
    // ==========================================

    const quantity =
      Number(customRecipe.quantity);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Custom recipe quantity must be greater than zero",
      });
    }

    // ==========================================
    // VALIDATE DELIVERY DATE
    // ==========================================

    const deliveryDate =
      new Date(
        customRecipe.preferredDeliveryDate
      );

    if (
      Number.isNaN(
        deliveryDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid preferred delivery date",
      });
    }

    // ==========================================
    // GENERATE TRACKING TOKEN
    // ==========================================

    const trackingToken =
      generateToken();

    // ==========================================
    // GENERATE CONFIRMATION TOKEN
    // ==========================================

    const confirmationToken =
      generateToken();

    // ==========================================
    // GENERATE UNIQUE ORDER ID
    // ==========================================

    let orderId;
    let existingOrder;

    do {
      orderId =
        generateOrderId();

      existingOrder =
        await Order.findOne({
          orderId,
        });
    } while (existingOrder);

    // ==========================================
    // CALCULATE TOTAL PRICE
    // ==========================================

    const totalPrice =
      quantity * quotedPrice;

    // ==========================================
    // CREATE CUSTOM ORDER ITEM
    // ==========================================

    const orderItem = {
      recipe: null,

      name:
        customRecipe.recipeName,

      quantity,

      unit:
        customRecipe.unit,

      pricePerUnit:
        quotedPrice,

      totalPrice,

      isCustomRecipe: true,
    };

    // ==========================================
    // FOOD TOTAL
    // ==========================================

    const foodTotal =
      totalPrice;

    // ==========================================
    // DELIVERY CHARGE
    // ==========================================

    const deliveryCharge = 0;

    // ==========================================
    // GRAND TOTAL
    // ==========================================

    const grandTotal =
      foodTotal + deliveryCharge;

    // ==========================================
    // CREATE ORDER
    // ==========================================

    const order =
      await Order.create({
        orderId,

        customer: {
          name:
            customRecipe.customer.name,

          phone:
            customRecipe.customer.phone,

          email:
            customRecipe.customer.email || "",
        },

        // IMPORTANT:
        // Delivery address comes from
        // the customer at order creation.
        deliveryAddress:
          deliveryAddress.trim(),

        mapPin:
          typeof mapPin === "string"
            ? mapPin.trim()
            : "",

        requestedDeliveryDate:
          deliveryDate,

        requestedDeliveryTime:
          customRecipe.preferredDeliveryTime,

        additionalInstructions:
          customRecipe.additionalInstructions ||
          "",

        items: [
          orderItem,
        ],

        foodTotal,

        deliveryCharge,

        grandTotal,

        deliveryPerson: null,

        status:
          "PENDING_CONFIRMATION",

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
            status:
              "PENDING_CONFIRMATION",

            changedBy:
              "system",

            note:
              "Order created from approved custom recipe request",
          },
        ],

        trackingToken,

        confirmationToken,

        confirmationTokenExpiresAt:
          new Date(
            Date.now() +
              24 * 60 * 60 * 1000
          ),

        confirmationTokenUsed: false,
      });

    // ==========================================
    // LINK ORDER TO CUSTOM RECIPE
    // ==========================================

    customRecipe.order =
      order._id;

    await customRecipe.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,

      message:
        "Order created successfully from approved custom recipe",

      order: {
        id:
          order._id,

        orderId:
          order.orderId,

        status:
          order.status,

        foodTotal:
          order.foodTotal,

        deliveryCharge:
          order.deliveryCharge,

        grandTotal:
          order.grandTotal,

        trackingToken:
          order.trackingToken,

        confirmationToken:
          order.confirmationToken,
      },

      customRecipe: {
        id:
          customRecipe._id,

        status:
          customRecipe.status,

        order:
          customRecipe.order,
      },
    });
  } catch (error) {
    console.error(
      "=========================================="
    );

    console.error(
      "CREATE ORDER FROM CUSTOM RECIPE ERROR"
    );

    console.error(
      "Name:",
      error.name
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );

    console.error(
      "=========================================="
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createCustomRecipeRequest,

  getAllCustomRecipeRequests,

  getCustomRecipeRequestById,

  updateCustomRecipeRequest,

  acceptCustomRecipeQuote,

  rejectCustomRecipeQuote,

  createOrderFromCustomRecipe,
};