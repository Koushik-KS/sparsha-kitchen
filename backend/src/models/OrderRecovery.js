const mongoose = require("mongoose");

const orderRecoverySchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    otpExpiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically remove expired recovery records.
orderRecoverySchema.index(
  { otpExpiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const OrderRecovery = mongoose.model(
  "OrderRecovery",
  orderRecoverySchema
);

module.exports = OrderRecovery;