const express = require("express");
const router = express.Router();
const multer = require("multer");

const orderController = require("../controllers/orderController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/add", protect, orderController.addItem);
router.get("/menu", protect, authorize("admin", "owner", "bartender", "exit", "entry"), orderController.getMenu);
router.get("/menu/categories", protect, authorize("admin", "owner", "bartender", "exit", "entry"), orderController.getMenuCategories);
router.post("/menu", protect, authorize("admin", "owner"), orderController.createMenuItem);
router.post("/menu/categories", protect, authorize("admin", "owner"), orderController.createMenuCategory);
router.post("/menu/upload", protect, authorize("admin", "owner"), upload.single("menuFile"), orderController.uploadMenu);

module.exports = router;
