const express = require("express");

const {
  createOrder,
  confirmOrderByCustomer,
  requestOrderChange,
} = require("../controllers/orderController");

const router = express.Router();

// ==========================================
// CUSTOMER ORDER ROUTES
// ==========================================

// Create order
router.post("/", createOrder);

// Confirm order
router.post("/confirm/:token", confirmOrderByCustomer);

// Request order change
router.post("/change-request/:token", requestOrderChange);

module.exports = router;