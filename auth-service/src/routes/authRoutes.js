const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);

const { protect, authorize, logout } = require("../middlewares/authMiddleware");

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

router.post("/logout", protect, logout);

// Example admin-only route
router.get("/admin-only", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Welcome Admin" });
});

module.exports = router;
