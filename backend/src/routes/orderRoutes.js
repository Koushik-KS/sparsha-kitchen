const express = require("express");

const {
  createOrder,
  confirmOrderByCustomer,
  requestOrderChange,
  trackOrderByToken,
  trackOrderByOrderIdAndPhone,
   requestOrderCancellation,
} = require("../controllers/orderController");

const router = express.Router();

// ==========================================
// CUSTOMER ORDER ROUTES
// ==========================================

// Create order
router.post("/", createOrder);

// Track by Order ID + phone
router.get("/track", trackOrderByOrderIdAndPhone);

// Track by secure tracking token
router.get("/track/:trackingToken", trackOrderByToken);

// Confirm order
router.post("/confirm/:token", confirmOrderByCustomer);

// Request order change
router.post("/change-request/:token", requestOrderChange);

router.post(
  "/cancel-request/:token",
  requestOrderCancellation
);

module.exports = router;