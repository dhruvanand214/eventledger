const Order = require("../models/Order");
const { redisClient } = require("../config/redis");
const publishEvent = require("../events/publisher");

exports.addItem = async (req, res) => {
  try {

    const { sessionId, itemName, price, quantity } = req.body;

    if (!sessionId || !itemName || !price || !quantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const sessionKey = `session:${sessionId}`;

    const sessionExists = await redisClient.exists(sessionKey);

    if (!sessionExists) {
      return res.status(404).json({ message: "Session not active" });
    }

    const totalIncrease = price * quantity;

    // Atomic bill update
    await redisClient.hIncrBy(sessionKey, "total", totalIncrease);

    // Save order history
    const order = await Order.create({
      sessionId,
      itemName,
      price,
      quantity
    });

    // Publish event for real-time dashboard
    await publishEvent("order.created", {
      sessionId,
      itemName,
      price,
      quantity
    });

    res.json({
      message: "Item added",
      order
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add item" });
  }
};