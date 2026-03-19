const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");
const { protect, authorize, logout } = require("../middlewares/authMiddleware");

router.post("/register", protect, authorize("admin", "owner"), authController.register);
router.post("/login", authController.login);

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

router.post("/logout", protect, logout);
router.post("/close-event", protect, adminController.closeEvent);
router.post("/event/bind", protect, authorize("admin", "owner"), authController.bindEvent);

// Example admin-only route
router.get("/admin-only", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Welcome Admin" });
});

module.exports = router;
