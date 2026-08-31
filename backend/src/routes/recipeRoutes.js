const express = require("express");

const {
  getPublicRecipes,
  getPublicRecipeById,
} = require("../controllers/recipeController");

const router = express.Router();

// ==========================================
// PUBLIC RECIPE ROUTES
// ==========================================

// Get all available public recipes
router.get("/", getPublicRecipes);

// Get one available public recipe
router.get("/:id", getPublicRecipeById);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;