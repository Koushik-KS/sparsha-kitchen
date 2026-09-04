const express = require("express");

const {
  createOrder,
  confirmOrderByCustomer,
  requestOrderChange,

  trackOrderByToken,
  trackOrderByOrderIdAndPhone,

  requestOrderCancellation,

  requestOrderIdRecovery,
  verifyOrderIdRecovery,
} = require("../controllers/orderController");

const router = express.Router();

// ==========================================
// CUSTOMER: CREATE ORDER
// ==========================================

router.post(
  "/",
  createOrder
);

// ==========================================
// CUSTOMER: TRACK ORDER
// ==========================================

router.get(
  "/track",
  trackOrderByOrderIdAndPhone
);

router.get(
  "/track/:trackingToken",
  trackOrderByToken
);

// ==========================================
// CUSTOMER: CONFIRM ORDER
// ==========================================

router.post(
  "/confirm/:token",
  confirmOrderByCustomer
);

// ==========================================
// CUSTOMER: CHANGE REQUEST
// ==========================================

router.post(
  "/change-request/:token",
  requestOrderChange
);

// ==========================================
// CUSTOMER: CANCELLATION REQUEST
// ==========================================

router.post(
  "/cancel-request/:token",
  requestOrderCancellation
);

// ==========================================
// CUSTOMER: FORGOT ORDER ID
// ==========================================

// Step 1: Request OTP using phone number
router.post(
  "/recover/request",
  requestOrderIdRecovery
);

// Step 2: Verify OTP and retrieve order IDs
router.post(
  "/recover/verify",
  verifyOrderIdRecovery
);

module.exports = router;