const express = require("express");

const {
  getBusinessSettings,
  updateBusinessSettings,
} = require("../controllers/businessSettingsController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Public - website can read contact details
router.get("/", getBusinessSettings);

// Admin only - update contact details
router.put("/", protectAdmin, updateBusinessSettings);

module.exports = router;