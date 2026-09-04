const mongoose = require("mongoose");

// ==========================================
// ORDER ITEM SCHEMA
// ==========================================

const orderItemSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    isCustomRecipe: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// STATUS HISTORY SCHEMA
// ==========================================

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },

    changedBy: {
      type: String,
      enum: ["customer", "admin", "system"],
      required: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// PAYMENT HISTORY SCHEMA
// ==========================================

const paymentHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    method: {
      type: String,
      enum: ["UPI", "CASH", "BANK_TRANSFER", "OTHER"],
      required: true,
    },

    recordedAt: {
      type: Date,
      default: Date.now,
    },

    recordedBy: {
      type: String,
      default: "admin",
      trim: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: true,
  }
);

// ==========================================
// ORDER SCHEMA
// ==========================================

const orderSchema = new mongoose.Schema(
  {
    // ==========================================
    // CUSTOMER-FRIENDLY ORDER ID
    // ==========================================

    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ==========================================
    // CUSTOMER
    // ==========================================

    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },
    },

    // ==========================================
    // DELIVERY DETAILS
    // ==========================================

    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },

    mapPin: {
      type: String,
      trim: true,
      default: "",
    },

    requestedDeliveryDate: {
      type: Date,
      required: true,
    },

    requestedDeliveryTime: {
      type: String,
      required: true,
      trim: true,
    },

    additionalInstructions: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // ORDER ITEMS
    // ==========================================

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: (items) => {
          return Array.isArray(items) && items.length > 0;
        },

        message: "Order must contain at least one item",
      },
    },

    // ==========================================
    // PRICE DETAILS
    // ==========================================

    foodTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================
    // PAYMENT
    // ==========================================

    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PARTIALLY_PAID", "PAID"],
      default: "UNPAID",
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentHistory: {
      type: [paymentHistorySchema],
      default: [],
    },

    // ==========================================
    // DELIVERY PERSON
    // ==========================================

    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPerson",
      default: null,
    },

    // ==========================================
    // ORDER STATUS
    // ==========================================

    status: {
      type: String,

      enum: [
        "PENDING_CONFIRMATION",
        "CUSTOMER_CONFIRMED",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],

      default: "PENDING_CONFIRMATION",
    },

    // ==========================================
    // CUSTOMER CONFIRMATION
    // ==========================================

    customerConfirmed: {
      type: Boolean,
      default: false,
    },

    customerConfirmedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // ADMIN CONFIRMATION
    // ==========================================

    adminConfirmed: {
      type: Boolean,
      default: false,
    },

    adminConfirmedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // CHANGE REQUEST
    // ==========================================

    changeRequested: {
      type: Boolean,
      default: false,
    },

    changeRequestMessage: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // CANCELLATION REQUEST
    // ==========================================

    cancellationRequested: {
      type: Boolean,
      default: false,
    },

    cancellationRequestMessage: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // STATUS HISTORY
    // ==========================================

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // ==========================================
    // DELIVERY OTP
    // ==========================================

    deliveryOtp: {
      type: String,
      default: null,
    },

    deliveryOtpHash: {
      type: String,
      default: null,
    },

    deliveryOtpExpiresAt: {
      type: Date,
      default: null,
    },

    deliveryOtpVerified: {
      type: Boolean,
      default: false,
    },

    deliveryOtpVerifiedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // CUSTOMER TRACKING TOKEN
    // ==========================================

    trackingToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ==========================================
    // CUSTOMER CONFIRMATION TOKEN
    // ==========================================

    confirmationToken: {
      type: String,
      default: null,
    },

    confirmationTokenExpiresAt: {
      type: Date,
      default: null,
    },

    confirmationTokenUsed: {
      type: Boolean,
      default: false,
    },
  },

  // ==========================================
  // AUTOMATIC CREATED / UPDATED DATES
  // ==========================================

  {
    timestamps: true,
  }
);

// ==========================================
// MODEL
// ==========================================

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;