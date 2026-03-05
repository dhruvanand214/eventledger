const express = require("express");
const router = express.Router();

const exitController = require("../controllers/exitController");

router.post("/close", exitController.closeSession);

module.exports = router;