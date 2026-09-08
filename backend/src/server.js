const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

// Load environment variables from backend/.env
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const connectDatabase = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const orderRoutes = require("./routes/orderRoutes");
const deliveryPersonRoutes = require("./routes/deliveryPersonRoutes");
const customRecipeRoutes = require("./routes/customRecipeRoutes");
const businessSettingsRoutes = require("./routes/businessSettingsRoutes");

// IMPORTANT: authMiddleware exports the function directly
const protectAdmin = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// CLOUDINARY CONFIGURATION
// ==========================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// IMAGE UPLOAD
// ==========================================

// Store uploaded image temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(
        new Error("Only image files are allowed.")
      );
    }

    cb(null, true);
  },
});

// ==========================================
// IMAGE UPLOAD API
// ==========================================

app.post(
  "/api/admin/upload-image",
  protectAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select an image.",
        });
      }

      const uploadResult = await new Promise(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "sparsha-kitchen/recipes",
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          stream.end(req.file.buffer);
        }
      );

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully.",
        imageUrl: uploadResult.secure_url,
      });
    } catch (error) {
      console.error(
        "Cloudinary image upload error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to upload image.",
      });
    }
  }
);

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/recipes", recipeRoutes);

app.use("/api/orders", orderRoutes);

app.use(
  "/api/admin/delivery-persons",
  deliveryPersonRoutes
);

app.use(
  "/api/custom-recipes",
  customRecipeRoutes
);

// Business contact settings
app.use(
  "/api/business-settings",
  businessSettingsRoutes
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message:
      "Sparsha Kitchen backend is running",
  });
});

// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(
        `Sparsha Kitchen backend running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup error:",
      error
    );

    process.exit(1);
  }
};

startServer();