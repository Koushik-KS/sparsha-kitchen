const mongoose = require("mongoose");

const customRecipeSchema = new mongoose.Schema(
  {
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
      min: 1,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

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

    additionalInstructions: {
      type: String,
      trim: true,
      default: "",
    },

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

const CustomRecipe = mongoose.model(
  "CustomRecipe",
  customRecipeSchema
);

module.exports = CustomRecipe;