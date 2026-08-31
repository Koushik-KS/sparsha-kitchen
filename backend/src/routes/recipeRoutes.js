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

// Public routes
router.get("/", getPublicRecipes);
router.get("/:id", getPublicRecipeById);

// Admin routes
router.post("/admin", protectAdmin, createRecipe);
router.get("/admin", protectAdmin, getAllRecipesAdmin);
router.put("/admin/:id", protectAdmin, updateRecipe);
router.delete("/admin/:id", protectAdmin, deleteRecipe);

module.exports = router;