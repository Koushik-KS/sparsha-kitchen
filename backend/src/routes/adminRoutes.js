const express = require("express");
const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", protectAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Admin authentication is working",
    admin: req.admin,
  });
});

module.exports = router;