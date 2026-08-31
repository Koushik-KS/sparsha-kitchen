const express = require("express");

const protectAdmin = require("../middleware/authMiddleware");

const {
  createRecipe,
  getAllRecipesAdmin,
  updateRecipe,
  deleteRecipe,
} = require("../controllers/recipeController");

const {
  getAllOrders,
  getOrderById,
  updateOrder,
  confirmOrderByAdmin,
} = require("../controllers/orderController");

const router = express.Router();

// ==========================================
// ADMIN AUTHENTICATION TEST
// ==========================================

router.get("/test", protectAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Admin authentication is working",
    admin: req.admin,
  });
});

// ==========================================
// RECIPE MANAGEMENT
// ==========================================

// Create recipe
router.post("/recipes", protectAdmin, createRecipe);

// Get all recipes
router.get("/recipes", protectAdmin, getAllRecipesAdmin);

// Update recipe
router.put("/recipes/:id", protectAdmin, updateRecipe);

// Delete recipe
router.delete("/recipes/:id", protectAdmin, deleteRecipe);

// ==========================================
// ORDER MANAGEMENT
// ==========================================

// Get all orders
router.get("/orders", protectAdmin, getAllOrders);

// Get one order
router.get("/orders/:id", protectAdmin, getOrderById);

// Update order
router.put("/orders/:id", protectAdmin, updateOrder);

// Admin final confirmation
router.post(
  "/orders/:id/confirm",
  protectAdmin,
  confirmOrderByAdmin
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;