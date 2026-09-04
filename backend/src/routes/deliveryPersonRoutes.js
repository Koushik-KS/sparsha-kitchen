const express = require("express");

const protectAdmin = require("../middleware/authMiddleware");

const {
  createDeliveryPerson,
  getAllDeliveryPersons,
  getDeliveryPersonById,
  updateDeliveryPerson,
  deleteDeliveryPerson,
  permanentlyDeleteDeliveryPerson,
  assignDeliveryPerson,
  removeDeliveryPerson,
} = require("../controllers/deliveryPersonController");

const router = express.Router();

// ==========================================
// DELIVERY PERSON MANAGEMENT
// ==========================================

// Create
router.post(
  "/",
  protectAdmin,
  createDeliveryPerson
);

// Get all
router.get(
  "/",
  protectAdmin,
  getAllDeliveryPersons
);

// Get one
router.get(
  "/:id",
  protectAdmin,
  getDeliveryPersonById
);

// Update
router.put(
  "/:id",
  protectAdmin,
  updateDeliveryPerson
);

// Deactivate (soft delete)
router.delete(
  "/:id",
  protectAdmin,
  deleteDeliveryPerson
);

// Permanently delete
router.delete(
  "/:id/permanent",
  protectAdmin,
  permanentlyDeleteDeliveryPerson
);

// Assign to order
router.patch(
  "/order/:id/assign",
  protectAdmin,
  assignDeliveryPerson
);

// Remove from order
router.patch(
  "/order/:id/remove",
  protectAdmin,
  removeDeliveryPerson
);

module.exports = router;