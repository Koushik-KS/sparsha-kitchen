const mongoose = require("mongoose");
const Recipe = require("../models/Recipe");

// Admin: Create recipe
const createRecipe = async (req, res) => {
  try {
    const {
      name,
      description,
      photos,
      price,
      unit,
      isAvailable,
      isActive,
    } = req.body;

    if (!name || price === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: "Name, price and unit are required",
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    const recipe = await Recipe.create({
      name: name.trim(),
      description: description?.trim() || "",
      photos: Array.isArray(photos) ? photos : [],
      price: Number(price),
      unit: unit.trim(),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      recipe,
    });
  } catch (error) {
    console.error("Create recipe error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Admin: Get all recipes
const getAllRecipesAdmin = async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      recipes,
    });
  } catch (error) {
    console.error("Get admin recipes error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Admin: Update recipe
const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID",
      });
    }

    const {
      name,
      description,
      photos,
      price,
      unit,
      isAvailable,
      isActive,
    } = req.body;

    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    if (photos !== undefined) {
      updateData.photos = Array.isArray(photos) ? photos : [];
    }
    if (price !== undefined) updateData.price = Number(price);
    if (unit !== undefined) updateData.unit = unit.trim();
    if (isAvailable !== undefined) {
      updateData.isAvailable = Boolean(isAvailable);
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const recipe = await Recipe.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recipe updated successfully",
      recipe,
    });
  } catch (error) {
    console.error("Update recipe error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Admin: Delete recipe
const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID",
      });
    }

    const recipe = await Recipe.findByIdAndDelete(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    console.error("Delete recipe error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Customer: Get public recipes
const getPublicRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      isActive: true,
      isAvailable: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      recipes,
    });
  } catch (error) {
    console.error("Get public recipes error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Customer: Get one public recipe
const getPublicRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe ID",
      });
    }

    const recipe = await Recipe.findOne({
      _id: id,
      isActive: true,
      isAvailable: true,
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    return res.status(200).json({
      success: true,
      recipe,
    });
  } catch (error) {
    console.error("Get public recipe error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createRecipe,
  getAllRecipesAdmin,
  updateRecipe,
  deleteRecipe,
  getPublicRecipes,
  getPublicRecipeById,
};