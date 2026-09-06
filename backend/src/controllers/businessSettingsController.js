const BusinessSettings = require("../models/BusinessSettings");

// Get business contact settings
const getBusinessSettings = async (req, res) => {
  try {
    let settings = await BusinessSettings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await BusinessSettings.create({
        phoneNumber: "",
        whatsappNumber: "",
        instagramUrl: "",
      });
    }

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get business settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load business settings",
    });
  }
};

// Update business contact settings
const updateBusinessSettings = async (req, res) => {
  try {
    const { phoneNumber, whatsappNumber, instagramUrl } = req.body;

    let settings = await BusinessSettings.findOne();

    if (!settings) {
      settings = new BusinessSettings();
    }

    settings.phoneNumber = String(phoneNumber || "").trim();
    settings.whatsappNumber = String(whatsappNumber || "").trim();
    settings.instagramUrl = String(instagramUrl || "").trim();

    await settings.save();

    res.json({
      success: true,
      message: "Business settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update business settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update business settings",
    });
  }
};

module.exports = {
  getBusinessSettings,
  updateBusinessSettings,
};