const express = require("express");
const router = express.Router();

const exitController = require("../controllers/exitController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.post("/close", protect, exitController.closeSession);
router.get("/summary/events", protect, authorize("owner", "admin"), exitController.getEventHistorySummary);
router.get("/summary/daily", protect, authorize("owner", "admin"), exitController.getDailySummary);

module.exports = router;
