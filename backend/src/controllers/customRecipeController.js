const crypto = require("crypto");
const mongoose = require("mongoose");

const CustomRecipe = require("../models/CustomRecipe");
const Order = require("../models/Order");

// ==========================================
// HELPERS
// ==========================================

const generateOrderId = () => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const randomNumber = Math.floor(
    1000 + Math.random() * 9000
  );

  return `SK-${year}${month}${day}-${randomNumber}`;
};

// ==========================================
// SECURE TOKEN
// ==========================================

const generateToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};

// ==========================================
// UNIQUE TRACK ID
// ==========================================

const generateUniqueTrackId = async () => {
  let trackId;
  let existingRequest;
  let existingOrder;

  do {
    trackId = generateOrderId();

    existingRequest =
      await CustomRecipe.findOne({
        trackId,
      });

    existingOrder =
      await Order.findOne({
        orderId: trackId,
      });
  } while (
    existingRequest ||
    existingOrder
  );

  return trackId;
};

// ==========================================
// CUSTOMER: CREATE CUSTOM RECIPE REQUEST
// ==========================================

const createCustomRecipeRequest = async (
  req,
  res
) => {
  try {
    const {
      customer,
      recipeName,
      description,
      quantity,
      unit,
      preferredDeliveryDate,
      preferredDeliveryTime,
      deliveryAddress,
      mapPin,
      additionalInstructions,
    } = req.body;

    // ========================================
    // REQUIRED FIELDS
    // ========================================

    if (
      !customer ||
      !customer.name ||
      !customer.phone ||
      !recipeName ||
      !description ||
      quantity === undefined ||
      quantity === null ||
      !unit ||
      !preferredDeliveryDate ||
      !preferredDeliveryTime ||
      !deliveryAddress
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name, phone, recipe name, description, quantity, unit, delivery date, delivery time and delivery address are required",
      });
    }

    // ========================================
    // QUANTITY
    // ========================================

    const parsedQuantity =
      Number(quantity);

    if (
      !Number.isFinite(
        parsedQuantity
      ) ||
      parsedQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be greater than zero",
      });
    }

    // ========================================
    // PHONE
    // ========================================

    const phone = String(
      customer.phone
    )
      .replace(/\D/g, "")
      .slice(0, 10);

    if (phone.length !== 10) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10-digit phone number",
      });
    }

    // ========================================
    // TRACK ID
    // ========================================

    const trackId =
      await generateUniqueTrackId();

    // ========================================
    // CREATE REQUEST
    // ========================================

    const customRecipe =
      await CustomRecipe.create({
        customer: {
          name:
            String(
              customer.name
            ).trim(),

          phone,

          email:
            String(
              customer.email || ""
            )
              .trim()
              .toLowerCase(),
        },

        trackId,

        recipeName:
          String(
            recipeName
          ).trim(),

        description:
          String(
            description
          ).trim(),

        quantity:
          parsedQuantity,

        unit:
          String(unit).trim(),

        preferredDeliveryDate:
          String(
            preferredDeliveryDate
          ).trim(),

        preferredDeliveryTime:
          String(
            preferredDeliveryTime
          ).trim(),

        deliveryAddress:
          String(
            deliveryAddress
          ).trim(),

        mapPin:
          typeof mapPin === "string"
            ? mapPin.trim()
            : "",

        additionalInstructions:
          typeof additionalInstructions ===
          "string"
            ? additionalInstructions.trim()
            : "",

        status:
          "PENDING",

        adminNote:
          "",

        quotedPrice:
          0,

        order:
          null,
      });

    console.log(
      "CUSTOM RECIPE CREATED:",
      {
        id:
          customRecipe._id,

        trackId:
          customRecipe.trackId,

        recipeName:
          customRecipe.recipeName,

        status:
          customRecipe.status,
      }
    );

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      message:
        "Custom recipe request received. Please save your Track ID.",

      customRecipe: {
        id:
          customRecipe._id,

        trackId:
          customRecipe.trackId,

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

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Unable to generate a unique Track ID. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error",
      error:
        error.message,
    });
  }
};

// ==========================================
// ADMIN: GET ALL CUSTOM RECIPE REQUESTS
// ==========================================

const getAllCustomRecipeRequests =
  async (req, res) => {
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
        message:
          "Server error",
      });
    }
  };

// ==========================================
// ADMIN: GET ONE REQUEST
// ==========================================

const getCustomRecipeRequestById =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid custom recipe request ID",
        });
      }

      const request =
        await CustomRecipe.findById(
          id
        ).populate("order");

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
        message:
          "Server error",
      });
    }
  };

// ==========================================
// ADMIN: UPDATE PRICE / NOTE
// ==========================================

const updateCustomRecipeRequest =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid custom recipe request ID",
        });
      }

      const request =
        await CustomRecipe.findById(
          id
        );

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            "Custom recipe request not found",
        });
      }

      const {
        adminNote,
        quotedPrice,
      } = req.body;

      const updateData = {};

      // ========================================
      // ADMIN NOTE
      // ========================================

      if (
        adminNote !== undefined
      ) {
        updateData.adminNote =
          String(
            adminNote
          ).trim();
      }

      // ========================================
      // PRICE
      // ========================================

      if (
        quotedPrice !== undefined
      ) {
        const price =
          Number(
            quotedPrice
          );

        if (
          !Number.isFinite(
            price
          ) ||
          price < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid quoted price",
          });
        }

        updateData.quotedPrice =
          price;
      }

      // ========================================
      // UPDATE WITHOUT FULL VALIDATION
      // ========================================

      const updatedRequest =
        await CustomRecipe.findByIdAndUpdate(
          id,
          {
            $set:
              updateData,
          },
          {
            new: true,
            runValidators: false,
          }
        );

      return res.status(200).json({
        success: true,

        message:
          "Custom recipe request updated successfully",

        request:
          updatedRequest,
      });
    } catch (error) {
      console.error(
        "Update custom recipe request error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error",
        error:
          error.message,
      });
    }
  };

// ==========================================
// ADMIN: APPROVE CUSTOM RECIPE
// ==========================================

const approveCustomRecipeRequest =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        quotedPrice,
        adminNote,
      } = req.body;

      // ========================================
      // VALIDATE ID
      // ========================================

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid custom recipe request ID",
        });
      }

      // ========================================
      // FIND REQUEST
      // ========================================

      const customRecipe =
        await CustomRecipe.findById(
          id
        );

      if (!customRecipe) {
        return res.status(404).json({
          success: false,
          message:
            "Custom recipe request not found",
        });
      }

      // ========================================
      // ALREADY CONVERTED
      // ========================================

      if (
        customRecipe.order
      ) {
        const existingOrder =
          await Order.findById(
            customRecipe.order
          );

        return res.status(400).json({
          success: false,

          message:
            "This custom recipe has already been converted into an order.",

          orderId:
            existingOrder?.orderId ||
            customRecipe.trackId ||
            null,
        });
      }

      // ========================================
      // TRACK ID REQUIRED
      // ========================================

      if (
        !customRecipe.trackId
      ) {
        return res.status(400).json({
          success: false,

          message:
            "This request does not have a Track ID. Please create a new custom recipe request.",
        });
      }

      // ========================================
      // ADDRESS REQUIRED
      // ========================================

      if (
        !customRecipe.deliveryAddress ||
        !String(
          customRecipe.deliveryAddress
        ).trim()
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Delivery address is missing. This request cannot be approved.",
        });
      }

      // ========================================
      // PRICE
      // ========================================

      let price;

      if (
        quotedPrice !== undefined
      ) {
        price =
          Number(
            quotedPrice
          );
      } else {
        price =
          Number(
            customRecipe.quotedPrice
          );
      }

      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Enter a valid quoted price greater than zero before approving.",
        });
      }

      // ========================================
      // QUANTITY
      // ========================================

      const quantity =
        Number(
          customRecipe.quantity
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Custom recipe quantity must be greater than zero.",
        });
      }

      // ========================================
      // DELIVERY DATE
      // ========================================

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
            "Invalid preferred delivery date.",
        });
      }

      // ========================================
      // CHECK ORDER ID
      // ========================================

      const existingOrder =
        await Order.findOne({
          orderId:
            customRecipe.trackId,
        });

      if (existingOrder) {
        return res.status(409).json({
          success: false,

          message:
            "This Track ID is already being used by an order.",
        });
      }

      // ========================================
      // INTERNAL TOKENS
      // ========================================

      const trackingToken =
        generateToken();

      const confirmationToken =
        generateToken();

      // ========================================
      // CALCULATE TOTAL
      // ========================================

      const totalPrice =
        quantity * price;

      const foodTotal =
        totalPrice;

      const deliveryCharge =
        0;

      const grandTotal =
        foodTotal +
        deliveryCharge;

      // ========================================
      // CREATE NORMAL ORDER
      // ========================================

      const order =
        await Order.create({
          // SAME TRACK ID
          orderId:
            customRecipe.trackId,

          // CUSTOMER
          customer: {
            name:
              customRecipe.customer.name,

            phone:
              customRecipe.customer.phone,

            email:
              customRecipe.customer.email ||
              "",
          },

          // DELIVERY
          deliveryAddress:
            customRecipe.deliveryAddress.trim(),

          mapPin:
            customRecipe.mapPin ||
            "",

          requestedDeliveryDate:
            deliveryDate,

          requestedDeliveryTime:
            customRecipe.preferredDeliveryTime,

          additionalInstructions:
            customRecipe.additionalInstructions ||
            "",

          // ITEMS
          items: [
            {
              recipe:
                null,

              name:
                customRecipe.recipeName,

              quantity,

              unit:
                customRecipe.unit,

              pricePerUnit:
                price,

              totalPrice,

              isCustomRecipe:
                true,
            },
          ],

          // TOTALS
          foodTotal,

          deliveryCharge,

          grandTotal,

          // ======================================
          // PAYMENT
          // ======================================
          //
          // IMPORTANT:
          // Order.js allows:
          // UNPAID / PARTIALLY_PAID / PAID
          //
          // Initial custom order = UNPAID
          //
          paymentStatus:
            "UNPAID",

          paidAmount:
            0,

          paymentHistory:
            [],

          // DELIVERY PERSON
          deliveryPerson:
            null,

          // ORDER STATUS
          status:
            "PENDING_CONFIRMATION",

          // CUSTOMER CONFIRMATION
          customerConfirmed:
            false,

          customerConfirmedAt:
            null,

          // ADMIN CONFIRMATION
          adminConfirmed:
            false,

          adminConfirmedAt:
            null,

          // CHANGE REQUEST
          changeRequested:
            false,

          changeRequestMessage:
            "",

          // CANCELLATION
          cancellationRequested:
            false,

          cancellationRequestMessage:
            "",

          // STATUS HISTORY
          statusHistory: [
            {
              status:
                "PENDING_CONFIRMATION",

              changedBy:
                "admin",

              note:
                "Order automatically created after Admin approval of custom recipe request.",
            },
          ],

          // INTERNAL TRACKING TOKEN
          trackingToken,

          // CONFIRMATION TOKEN
          confirmationToken,

          confirmationTokenExpiresAt:
            new Date(
              Date.now() +
                24 *
                  60 *
                  60 *
                  1000
            ),

          confirmationTokenUsed:
            false,
        });

      // ========================================
      // LINK CUSTOM RECIPE TO ORDER
      // ========================================

      const updateData = {
        status:
          "APPROVED",

        quotedPrice:
          price,

        order:
          order._id,
      };

      if (
        adminNote !== undefined
      ) {
        updateData.adminNote =
          String(
            adminNote
          ).trim();
      }

      await CustomRecipe.findByIdAndUpdate(
        id,
        {
          $set:
            updateData,
        },
        {
          new: true,
          runValidators: false,
        }
      );

      console.log(
        "CUSTOM RECIPE APPROVED:",
        {
          customRecipeId:
            customRecipe._id,

          trackId:
            customRecipe.trackId,

          orderId:
            order.orderId,

          orderMongoId:
            order._id,
        }
      );

      // ========================================
      // RESPONSE
      // ========================================

      return res.status(201).json({
        success: true,

        message:
          "Custom recipe approved and normal order created successfully.",

        customRecipe: {
          id:
            customRecipe._id,

          trackId:
            customRecipe.trackId,

          status:
            "APPROVED",

          order:
            order._id,
        },

        order: {
          id:
            order._id,

          orderId:
            order.orderId,

          status:
            order.status,

          paymentStatus:
            order.paymentStatus,

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
      });
    } catch (error) {
      console.error(
        "=========================================="
      );

      console.error(
        "APPROVE CUSTOM RECIPE ERROR"
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

        message:
          "Unable to approve custom recipe.",

        error:
          error.message,
      });
    }
  };

// ==========================================
// ADMIN: REJECT CUSTOM RECIPE
// ==========================================

const rejectCustomRecipeRequest =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        adminNote,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid custom recipe request ID",
        });
      }

      const request =
        await CustomRecipe.findById(
          id
        );

      if (!request) {
        return res.status(404).json({
          success: false,

          message:
            "Custom recipe request not found",
        });
      }

      // ========================================
      // ALREADY AN ORDER
      // ========================================

      if (
        request.order
      ) {
        return res.status(400).json({
          success: false,

          message:
            "This custom recipe has already been converted into an order and cannot be rejected.",
        });
      }

      const updateData = {
        status:
          "REJECTED",
      };

      if (
        adminNote !== undefined
      ) {
        updateData.adminNote =
          String(
            adminNote
          ).trim();
      }

      const updatedRequest =
        await CustomRecipe.findByIdAndUpdate(
          id,
          {
            $set:
              updateData,
          },
          {
            new: true,
            runValidators: false,
          }
        );

      console.log(
        "CUSTOM RECIPE REJECTED:",
        {
          id:
            request._id,

          trackId:
            request.trackId,
        }
      );

      return res.status(200).json({
        success: true,

        message:
          "Custom recipe request rejected successfully.",

        request:
          updatedRequest,
      });
    } catch (error) {
      console.error(
        "Reject custom recipe request error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to reject custom recipe request.",

        error:
          error.message,
      });
    }
  };

// ==========================================
// ADMIN: DELETE CUSTOM RECIPE REQUEST
// ==========================================
//
// Deletes ONLY the CustomRecipe record.
// If a normal Order already exists, the Order
// is NOT deleted.
// ==========================================

const deleteCustomRecipeRequest =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid custom recipe request ID",
        });
      }

      const request =
        await CustomRecipe.findById(
          id
        );

      if (!request) {
        return res.status(404).json({
          success: false,

          message:
            "Custom recipe request not found",
        });
      }

      // ========================================
      // DELETE REQUEST ONLY
      // ========================================

      await CustomRecipe.findByIdAndDelete(
        id
      );

      console.log(
        "CUSTOM RECIPE REQUEST DELETED:",
        {
          id:
            request._id,

          trackId:
            request.trackId,

          linkedOrder:
            request.order
              ? String(
                  request.order
                )
              : null,
        }
      );

      return res.status(200).json({
        success: true,

        message:
          "Custom recipe request deleted successfully. Any existing normal order remains unchanged.",
      });
    } catch (error) {
      console.error(
        "Delete custom recipe request error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to delete custom recipe request.",

        error:
          error.message,
      });
    }
  };

// ==========================================
// CUSTOMER: ACCEPT OLD QUOTE FLOW
// ==========================================

const acceptCustomRecipeQuote =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid custom recipe request ID",
        });
      }

      const request =
        await CustomRecipe.findById(
          id
        );

      if (!request) {
        return res.status(404).json({
          success: false,

          message:
            "Custom recipe request not found",
        });
      }

      if (
        request.status !==
        "QUOTED"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Only a quoted custom recipe can be accepted",
        });
      }

      const quotedPrice =
        Number(
          request.quotedPrice
        );

      if (
        !Number.isFinite(
          quotedPrice
        ) ||
        quotedPrice <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "A valid quoted price is required",
        });
      }

      const updatedRequest =
        await CustomRecipe.findByIdAndUpdate(
          id,
          {
            $set: {
              status:
                "APPROVED",
            },
          },
          {
            new: true,
            runValidators: false,
          }
        );

      return res.status(200).json({
        success: true,

        message:
          "Custom recipe quote accepted successfully",

        customRecipe: {
          id:
            updatedRequest._id,

          trackId:
            updatedRequest.trackId,

          recipeName:
            updatedRequest.recipeName,

          status:
            updatedRequest.status,

          quotedPrice:
            updatedRequest.quotedPrice,
        },
      });
    } catch (error) {
      console.error(
        "Accept custom recipe quote error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Server error",

        error:
          error.message,
      });
    }
  };

// ==========================================
// CUSTOMER: REJECT OLD QUOTE FLOW
// ==========================================

const rejectCustomRecipeQuote =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid custom recipe request ID",
        });
      }

      const request =
        await CustomRecipe.findById(
          id
        );

      if (!request) {
        return res.status(404).json({
          success: false,

          message:
            "Custom recipe request not found",
        });
      }

      if (
        request.status !==
        "QUOTED"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Only a quoted custom recipe can be rejected",
        });
      }

      const updatedRequest =
        await CustomRecipe.findByIdAndUpdate(
          id,
          {
            $set: {
              status:
                "REJECTED",
            },
          },
          {
            new: true,
            runValidators: false,
          }
        );

      return res.status(200).json({
        success: true,

        message:
          "Custom recipe quote rejected successfully",

        customRecipe: {
          id:
            updatedRequest._id,

          trackId:
            updatedRequest.trackId,

          recipeName:
            updatedRequest.recipeName,

          status:
            updatedRequest.status,
        },
      });
    } catch (error) {
      console.error(
        "Reject custom recipe quote error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Server error",

        error:
          error.message,
      });
    }
  };

// ==========================================
// CUSTOMER: CREATE ORDER FROM APPROVED
// ==========================================
//
// Compatibility endpoint.
// New workflow uses Admin Approve.
// ==========================================

const createOrderFromCustomRecipe =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid custom recipe request ID",
        });
      }

      const customRecipe =
        await CustomRecipe.findById(
          id
        );

      if (!customRecipe) {
        return res.status(404).json({
          success: false,

          message:
            "Custom recipe request not found",
        });
      }

      // ========================================
      // ALREADY EXISTS
      // ========================================

      if (
        customRecipe.order
      ) {
        const existingOrder =
          await Order.findById(
            customRecipe.order
          );

        return res.status(200).json({
          success: true,

          message:
            "Order already exists for this custom recipe.",

          order:
            existingOrder,

          customRecipe,
        });
      }

      // ========================================
      // MUST BE APPROVED
      // ========================================

      if (
        customRecipe.status !==
        "APPROVED"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Custom recipe must be approved before creating an order",
        });
      }

      // ========================================
      // REQUIRED DATA
      // ========================================

      if (
        !customRecipe.trackId
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Track ID is missing",
        });
      }

      if (
        !customRecipe.deliveryAddress
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Delivery address is required",
        });
      }

      const quotedPrice =
        Number(
          customRecipe.quotedPrice
        );

      if (
        !Number.isFinite(
          quotedPrice
        ) ||
        quotedPrice <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "A valid quoted price is required",
        });
      }

      const quantity =
        Number(
          customRecipe.quantity
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Custom recipe quantity must be greater than zero",
        });
      }

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

      // ========================================
      // TOKENS
      // ========================================

      const trackingToken =
        generateToken();

      const confirmationToken =
        generateToken();

      // ========================================
      // TOTALS
      // ========================================

      const totalPrice =
        quantity *
        quotedPrice;

      const foodTotal =
        totalPrice;

      const deliveryCharge =
        0;

      const grandTotal =
        foodTotal +
        deliveryCharge;

      // ========================================
      // CREATE ORDER
      // ========================================

      const order =
        await Order.create({
          orderId:
            customRecipe.trackId,

          customer: {
            name:
              customRecipe.customer.name,

            phone:
              customRecipe.customer.phone,

            email:
              customRecipe.customer.email ||
              "",
          },

          deliveryAddress:
            customRecipe.deliveryAddress.trim(),

          mapPin:
            customRecipe.mapPin ||
            "",

          requestedDeliveryDate:
            deliveryDate,

          requestedDeliveryTime:
            customRecipe.preferredDeliveryTime,

          additionalInstructions:
            customRecipe.additionalInstructions ||
            "",

          items: [
            {
              recipe:
                null,

              name:
                customRecipe.recipeName,

              quantity,

              unit:
                customRecipe.unit,

              pricePerUnit:
                quotedPrice,

              totalPrice,

              isCustomRecipe:
                true,
            },
          ],

          foodTotal,

          deliveryCharge,

          grandTotal,

          // CORRECT PAYMENT STATUS
          paymentStatus:
            "UNPAID",

          paidAmount:
            0,

          paymentHistory:
            [],

          deliveryPerson:
            null,

          status:
            "PENDING_CONFIRMATION",

          customerConfirmed:
            false,

          customerConfirmedAt:
            null,

          adminConfirmed:
            false,

          adminConfirmedAt:
            null,

          changeRequested:
            false,

          changeRequestMessage:
            "",

          cancellationRequested:
            false,

          cancellationRequestMessage:
            "",

          statusHistory: [
            {
              status:
                "PENDING_CONFIRMATION",

              changedBy:
                "system",

              note:
                "Order created from approved custom recipe request.",
            },
          ],

          trackingToken,

          confirmationToken,

          confirmationTokenExpiresAt:
            new Date(
              Date.now() +
                24 *
                  60 *
                  60 *
                  1000
            ),

          confirmationTokenUsed:
            false,
        });

      // ========================================
      // LINK ORDER
      // ========================================

      await CustomRecipe.findByIdAndUpdate(
        id,
        {
          $set: {
            order:
              order._id,
          },
        },
        {
          new: true,
          runValidators: false,
        }
      );

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

          paymentStatus:
            order.paymentStatus,

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
      });
    } catch (error) {
      console.error(
        "CREATE ORDER FROM CUSTOM RECIPE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Server error",

        error:
          error.message,
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

  approveCustomRecipeRequest,

  rejectCustomRecipeRequest,

  deleteCustomRecipeRequest,

  acceptCustomRecipeQuote,

  rejectCustomRecipeQuote,

  createOrderFromCustomRecipe,
};