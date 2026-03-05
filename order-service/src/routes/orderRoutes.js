const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");

router.post("/add", orderController.addItem);

module.exports = router;