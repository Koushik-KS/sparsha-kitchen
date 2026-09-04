const mongoose = require("mongoose");

const customRecipeSchema = new mongoose.Schema(
  {
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
    // CUSTOMER-FACING TRACK ID
    // ==========================================

    trackId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // ==========================================
    // RECIPE
    // ==========================================

    recipeName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
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

    // ==========================================
    // DELIVERY
    // ==========================================

    preferredDeliveryDate: {
      type: String,
      required: true,
      trim: true,
    },

    preferredDeliveryTime: {
      type: String,
      required: true,
      trim: true,
    },

    // REQUIRED FOR AUTOMATIC ORDER CREATION
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // OPTIONAL GOOGLE MAPS LOCATION
    mapPin: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // ADDITIONAL INSTRUCTIONS
    // ==========================================

    additionalInstructions: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // STATUS
    // ==========================================

    status: {
      type: String,

      enum: [
        "PENDING",
        "CONTACTED",
        "QUOTED",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ],

      default: "PENDING",
    },

    // ==========================================
    // ADMIN
    // ==========================================

    adminNote: {
      type: String,
      trim: true,
      default: "",
    },

    quotedPrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ==========================================
    // NORMAL ORDER REFERENCE
    // ==========================================

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// ==========================================
// MODEL
// ==========================================

const CustomRecipe = mongoose.model(
  "CustomRecipe",
  customRecipeSchema
);

module.exports = CustomRecipe;