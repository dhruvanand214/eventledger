const { redisClient } = require("../config/redis");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");

exports.createSession = async (req, res) => {
  try {

    const { customerName } = req.body;

    const sessionId = uuidv4();
    const sessionKey = `session:${sessionId}`;

    await redisClient.hSet(sessionKey, {
      customerName,
      status: "ACTIVE",
      total: 0,
      entryTime: Date.now()
    });

    await redisClient.expire(sessionKey, process.env.SESSION_TTL);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(sessionId);

    res.status(201).json({
      sessionId,
      qrCode
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Session creation failed" });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await redisClient.hGetAll(`session:${sessionId}`);

    if (!session || Object.keys(session).length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);

  } catch (error) {
    res.status(500).json({ message: "Error fetching session" });
  }
};

