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
  updateOrderStatus,
  handleCancellationRequest,
} = require("../controllers/orderController");

const deliveryPersonController = require("../controllers/deliveryPersonController");

const router = express.Router();

// ==========================================
// DELIVERY PERSON CONTROLLER FUNCTIONS
// ==========================================

const getAllDeliveryPersons =
  deliveryPersonController.getAllDeliveryPersons;

const assignDeliveryPerson =
  deliveryPersonController.assignDeliveryPerson;

const removeDeliveryPerson =
  deliveryPersonController.removeDeliveryPerson;

// ==========================================
// ADMIN AUTHENTICATION TEST
// ==========================================

router.get(
  "/test",
  protectAdmin,
  (req, res) => {
    res.json({
      success: true,
      message:
        "Admin authentication is working",
      admin: req.admin,
    });
  }
);

// ==========================================
// RECIPE MANAGEMENT
// ==========================================

// Create recipe
router.post(
  "/recipes",
  protectAdmin,
  createRecipe
);

// Get all recipes
router.get(
  "/recipes",
  protectAdmin,
  getAllRecipesAdmin
);

// Update recipe
router.put(
  "/recipes/:id",
  protectAdmin,
  updateRecipe
);

// Delete recipe
router.delete(
  "/recipes/:id",
  protectAdmin,
  deleteRecipe
);

// ==========================================
// ORDER MANAGEMENT
// ==========================================

// Get all orders
router.get(
  "/orders",
  protectAdmin,
  getAllOrders
);

// Get one order
router.get(
  "/orders/:id",
  protectAdmin,
  getOrderById
);

// Update order details
router.put(
  "/orders/:id",
  protectAdmin,
  updateOrder
);

// Admin final confirmation
router.post(
  "/orders/:id/confirm",
  protectAdmin,
  confirmOrderByAdmin
);

// Update order status
router.patch(
  "/orders/:id/status",
  protectAdmin,
  updateOrderStatus
);

// Handle cancellation request
router.patch(
  "/orders/:id/cancellation",
  protectAdmin,
  handleCancellationRequest
);

// ==========================================
// DELIVERY PERSON MANAGEMENT
// ==========================================

// Get all delivery persons
router.get(
  "/delivery-persons",
  protectAdmin,
  getAllDeliveryPersons
);

// Assign delivery person to order
router.patch(
  "/delivery-persons/order/:id/assign",
  protectAdmin,
  assignDeliveryPerson
);

// Remove delivery person from order
router.patch(
  "/delivery-persons/order/:id/remove",
  protectAdmin,
  removeDeliveryPerson
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;