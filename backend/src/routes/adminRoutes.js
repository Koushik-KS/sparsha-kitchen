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
  addPayment,
  verifyDeliveryOtp,
  deleteOrder,
} = require("../controllers/orderController");

const deliveryPersonController =
  require("../controllers/deliveryPersonController");

const getAllDeliveryPersons =
  deliveryPersonController.getAllDeliveryPersons;

const assignDeliveryPerson =
  deliveryPersonController.assignDeliveryPerson;

const removeDeliveryPerson =
  deliveryPersonController.removeDeliveryPerson;

const router = express.Router();

// ==========================================
// ADMIN AUTH TEST
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
// RECIPES
// ==========================================

router.post(
  "/recipes",
  protectAdmin,
  createRecipe
);

router.get(
  "/recipes",
  protectAdmin,
  getAllRecipesAdmin
);

router.put(
  "/recipes/:id",
  protectAdmin,
  updateRecipe
);

router.delete(
  "/recipes/:id",
  protectAdmin,
  deleteRecipe
);

// ==========================================
// ORDERS
// ==========================================

router.get(
  "/orders",
  protectAdmin,
  getAllOrders
);

router.get(
  "/orders/:id",
  protectAdmin,
  getOrderById
);

router.put(
  "/orders/:id",
  protectAdmin,
  updateOrder
);

router.post(
  "/orders/:id/confirm",
  protectAdmin,
  confirmOrderByAdmin
);

// ==========================================
// PAYMENT
// ==========================================

router.post(
  "/orders/:id/payment",
  protectAdmin,
  addPayment
);

// ==========================================
// DELIVERY OTP
// ==========================================

router.post(
  "/orders/:id/verify-otp",
  protectAdmin,
  verifyDeliveryOtp
);

// ==========================================
// ORDER STATUS
// ==========================================

router.patch(
  "/orders/:id/status",
  protectAdmin,
  updateOrderStatus
);

// ==========================================
// CANCELLATION
// ==========================================

router.patch(
  "/orders/:id/cancellation",
  protectAdmin,
  handleCancellationRequest
);

// ==========================================
// DELIVERY TEAM
// ==========================================

router.get(
  "/delivery-persons",
  protectAdmin,
  getAllDeliveryPersons
);

router.patch(
  "/delivery-persons/order/:id/assign",
  protectAdmin,
  assignDeliveryPerson
);

router.patch(
  "/delivery-persons/order/:id/remove",
  protectAdmin,
  removeDeliveryPerson
);

router.delete(
  "/orders/:id",
  protectAdmin,
  deleteOrder
);

module.exports = router;