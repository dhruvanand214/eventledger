const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/", protect, sessionController.createSession);
router.get("/", protect, sessionController.getActiveSessions);
router.get("/:sessionId", protect, sessionController.getSession);

module.exports = router;
