const mongoose = require("mongoose");

const businessSettingsSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },

    whatsappNumber: {
      type: String,
      default: "",
      trim: true,
    },

    instagramUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BusinessSettings", businessSettingsSchema);