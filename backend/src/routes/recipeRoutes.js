const express = require("express");

const {
  createRecipe,
  getAllRecipesAdmin,
  updateRecipe,
  deleteRecipe,
  getPublicRecipes,
  getPublicRecipeById,
} = require("../controllers/recipeController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Public recipe routes
router.get("/", getPublicRecipes);
router.get("/:id", getPublicRecipeById);

module.exports = router;