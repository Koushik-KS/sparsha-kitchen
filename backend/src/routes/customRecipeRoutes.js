const express = require("express");

const protectAdmin = require("../middleware/authMiddleware");

const {
  createCustomRecipeRequest,
  getAllCustomRecipeRequests,
  getCustomRecipeRequestById,
  updateCustomRecipeRequest,
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
// CUSTOMER: ACCEPT QUOTE
// ==========================================

router.post(
  "/:id/accept",
  acceptCustomRecipeQuote
);

// ==========================================
// CUSTOMER: REJECT QUOTE
// ==========================================

router.post(
  "/:id/reject",
  rejectCustomRecipeQuote
);

// ==========================================
// CUSTOMER: CREATE ORDER FROM APPROVED
// CUSTOM RECIPE
// ==========================================

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

router.put(
  "/:id",
  protectAdmin,
  updateCustomRecipeRequest
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;