const express = require("express");

const protectAdmin = require("../middleware/authMiddleware");

const {
  createCustomRecipeRequest,
  getAllCustomRecipeRequests,
  getCustomRecipeRequestById,
  updateCustomRecipeRequest,
  approveCustomRecipeRequest,
  rejectCustomRecipeRequest,
  deleteCustomRecipeRequest,
  acceptCustomRecipeQuote,
  rejectCustomRecipeQuote,
  createOrderFromCustomRecipe,
} = require("../controllers/customRecipeController");

const router = express.Router();

// ==========================================
// CUSTOMER: CREATE CUSTOM RECIPE REQUEST
// ==========================================

router.post(
  "/",
  createCustomRecipeRequest
);

// ==========================================
// ADMIN: GET ALL CUSTOM RECIPE REQUESTS
// ==========================================

router.get(
  "/",
  protectAdmin,
  getAllCustomRecipeRequests
);

// ==========================================
// ADMIN: APPROVE CUSTOM RECIPE
// ==========================================
//
// Approval automatically creates a normal Order.
// Same Track ID becomes Order.orderId.
//
// ==========================================

router.post(
  "/:id/approve",
  protectAdmin,
  approveCustomRecipeRequest
);

// ==========================================
// ADMIN: REJECT CUSTOM RECIPE
// ==========================================

router.post(
  "/:id/admin-reject",
  protectAdmin,
  rejectCustomRecipeRequest
);

// ==========================================
// ADMIN: DELETE CUSTOM RECIPE REQUEST
// ==========================================

router.delete(
  "/:id",
  protectAdmin,
  deleteCustomRecipeRequest
);

// ==========================================
// CUSTOMER: ACCEPT OLD QUOTE FLOW
// ==========================================
// Kept for compatibility with existing code.

router.post(
  "/:id/accept",
  acceptCustomRecipeQuote
);

// ==========================================
// CUSTOMER: REJECT OLD QUOTE FLOW
// ==========================================
// Kept for compatibility with existing code.

router.post(
  "/:id/reject",
  rejectCustomRecipeQuote
);

// ==========================================
// CUSTOMER: CREATE ORDER FROM APPROVED
// CUSTOM RECIPE
// ==========================================
// Kept for compatibility.
// New workflow creates order automatically
// when Admin approves.

router.post(
  "/:id/create-order",
  createOrderFromCustomRecipe
);

// ==========================================
// ADMIN: GET ONE CUSTOM RECIPE REQUEST
// ==========================================

router.get(
  "/:id",
  protectAdmin,
  getCustomRecipeRequestById
);

// ==========================================
// ADMIN: UPDATE CUSTOM RECIPE REQUEST
// ==========================================
// Used for quoted price / admin note only.
// There is NO Save Request button.

router.put(
  "/:id",
  protectAdmin,
  updateCustomRecipeRequest
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;