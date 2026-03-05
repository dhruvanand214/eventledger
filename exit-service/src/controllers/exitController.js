const { redisClient } = require("../config/redis");
const SessionHistory = require("../models/SessionHistory");
const publishEvent = require("../events/publisher");

exports.closeSession = async (req, res) => {
  try {

    const { sessionId } = req.body;

    const sessionKey = `session:${sessionId}`;

    const session = await redisClient.hGetAll(sessionKey);

    if (!session || Object.keys(session).length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const total = parseInt(session.total);

    const record = await SessionHistory.create({
      sessionId,
      customerName: session.customerName,
      entryTime: session.entryTime,
      exitTime: Date.now(),
      total
    });

    await redisClient.del(sessionKey);

    await publishEvent("session.closed", {
      sessionId,
      total
    });

    res.json({
      message: "Session closed",
      total,
      record
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to close session" });
  }
};