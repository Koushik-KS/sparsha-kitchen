const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

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

// IMPORTANT: authMiddleware exports the function directly
const protectAdmin = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// LOCAL IMAGE UPLOADS
// ==========================================

const uploadsDirectory = path.join(
  __dirname,
  "../uploads"
);

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDirectory);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    cb(
      null,
      `${safeName}-${Date.now()}${extension}`
    );
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  // Accept all image file types
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(
        new Error("Only image files are allowed.")
      );
    }

    cb(null, true);
  },
});

// Serve uploaded images publicly
app.use(
  "/uploads",
  express.static(uploadsDirectory)
);

// ==========================================
// IMAGE UPLOAD API
// ==========================================

app.post(
  "/api/admin/upload-image",
  protectAdmin,
  upload.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select an image.",
        });
      }

      const imageUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/${req.file.filename}`;

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully.",
        imageUrl,
      });
    } catch (error) {
      console.error(
        "Image upload error:",
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