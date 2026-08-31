const mongoose = require("mongoose");

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
  { _id: false }
);

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
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

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

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },

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

    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPerson",
      default: null,
    },

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

    customerConfirmed: {
      type: Boolean,
      default: false,
    },

    customerConfirmedAt: {
      type: Date,
      default: null,
    },

    adminConfirmed: {
      type: Boolean,
      default: false,
    },

    adminConfirmedAt: {
      type: Date,
      default: null,
    },

    changeRequested: {
      type: Boolean,
      default: false,
    },

    changeRequestMessage: {
      type: String,
      trim: true,
      default: "",
    },

    cancellationRequested: {
      type: Boolean,
      default: false,
    },

    cancellationRequestMessage: {
      type: String,
      trim: true,
      default: "",
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    trackingToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

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
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;