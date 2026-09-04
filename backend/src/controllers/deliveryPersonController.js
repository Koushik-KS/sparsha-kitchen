const mongoose = require("mongoose");

const DeliveryPerson = require("../models/DeliveryPerson");
const Order = require("../models/Order");

// ==========================================
// ADMIN: CREATE DELIVERY PERSON
// ==========================================

const createDeliveryPerson = async (req, res) => {
  try {
    const { name, phone, whatsapp } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Delivery person name is required",
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Delivery person phone is required",
      });
    }

    const deliveryPerson = await DeliveryPerson.create({
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp?.trim() || "",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Delivery person created successfully",
      deliveryPerson,
    });
  } catch (error) {
    console.error("Create delivery person error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: GET ALL DELIVERY PERSONS
// ==========================================

const getAllDeliveryPersons = async (req, res) => {
  try {
    const deliveryPersons = await DeliveryPerson.find().sort({
      isActive: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      deliveryPersons,
    });
  } catch (error) {
    console.error("Get delivery persons error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: GET ONE DELIVERY PERSON
// ==========================================

const getDeliveryPersonById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery person ID",
      });
    }

    const deliveryPerson = await DeliveryPerson.findById(id);

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }

    return res.status(200).json({
      success: true,
      deliveryPerson,
    });
  } catch (error) {
    console.error("Get delivery person error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: UPDATE DELIVERY PERSON
// ==========================================

const updateDeliveryPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, whatsapp, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery person ID",
      });
    }

    const deliveryPerson = await DeliveryPerson.findById(id);

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      deliveryPerson.name = name.trim();
    }

    if (phone !== undefined) {
      if (!phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Phone cannot be empty",
        });
      }

      deliveryPerson.phone = phone.trim();
    }

    if (whatsapp !== undefined) {
      deliveryPerson.whatsapp = whatsapp.trim();
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      deliveryPerson.isActive = isActive;
    }

    await deliveryPerson.save();

    return res.status(200).json({
      success: true,
      message: "Delivery person updated successfully",
      deliveryPerson,
    });
  } catch (error) {
    console.error("Update delivery person error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: DEACTIVATE DELIVERY PERSON
// ==========================================

const deleteDeliveryPerson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery person ID",
      });
    }

    const deliveryPerson = await DeliveryPerson.findById(id);

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }

    // Soft delete: keep record but make inactive
    deliveryPerson.isActive = false;

    await deliveryPerson.save();

    return res.status(200).json({
      success: true,
      message: "Delivery person deactivated successfully",
      deliveryPerson,
    });
  } catch (error) {
    console.error("Deactivate delivery person error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: PERMANENTLY DELETE DELIVERY PERSON
// ==========================================

const permanentlyDeleteDeliveryPerson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery person ID",
      });
    }

    const deliveryPerson =
      await DeliveryPerson.findById(id);

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }

    // Check whether this person is currently assigned
    // to any order that has not been completed/cancelled.
    const activeAssignedOrder = await Order.findOne({
      deliveryPerson: deliveryPerson._id,
      status: {
        $nin: ["DELIVERED", "CANCELLED"],
      },
    }).select("orderId status");

    if (activeAssignedOrder) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot delete this delivery person because they are currently assigned to order ${activeAssignedOrder.orderId} (${activeAssignedOrder.status}). Remove the assignment first.`,
      });
    }

    // Permanently remove from database.
    await DeliveryPerson.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Delivery person deleted permanently",
    });
  } catch (error) {
    console.error(
      "Permanent delete delivery person error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: ASSIGN DELIVERY PERSON TO ORDER
// ==========================================

const assignDeliveryPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryPersonId } = req.body;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Validate delivery person ID
    if (!deliveryPersonId) {
      return res.status(400).json({
        success: false,
        message: "Delivery person ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(deliveryPersonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery person ID",
      });
    }

    // Find order
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Cannot assign to cancelled or delivered orders
    if (
      ["CANCELLED", "DELIVERED"].includes(
        order.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Delivery person cannot be assigned when order status is ${order.status}`,
      });
    }

    // Find active delivery person
    const deliveryPerson =
      await DeliveryPerson.findOne({
        _id: deliveryPersonId,
        isActive: true,
      });

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Active delivery person not found",
      });
    }

    // Assign delivery person
    order.deliveryPerson = deliveryPerson._id;

    order.statusHistory.push({
      status: order.status,
      changedBy: "admin",
      note: `Delivery person assigned: ${deliveryPerson.name}`,
    });

    await order.save();

    await order.populate(
      "deliveryPerson",
      "name phone whatsapp"
    );

    return res.status(200).json({
      success: true,
      message:
        "Delivery person assigned successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
        deliveryPerson: order.deliveryPerson,
      },
    });
  } catch (error) {
    console.error(
      "Assign delivery person error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: REMOVE DELIVERY PERSON FROM ORDER
// ==========================================

const removeDeliveryPerson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.deliveryPerson) {
      return res.status(400).json({
        success: false,
        message:
          "No delivery person is assigned to this order",
      });
    }

    order.deliveryPerson = null;

    order.statusHistory.push({
      status: order.status,
      changedBy: "admin",
      note: "Delivery person removed from order",
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Delivery person removed successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
        deliveryPerson: null,
      },
    });
  } catch (error) {
    console.error(
      "Remove delivery person error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createDeliveryPerson,
  getAllDeliveryPersons,
  getDeliveryPersonById,
  updateDeliveryPerson,
  deleteDeliveryPerson,
  permanentlyDeleteDeliveryPerson,
  assignDeliveryPerson,
  removeDeliveryPerson,
};