const { redisClient } = require("../config/redis");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const publishEvent = require("../events/publisher");
const DemoSession = require("../models/DemoSession");

const getContext = (req) => ({
  clubId: req.user?.clubId || "default-club",
  clubName: req.user?.clubName || "Default Club",
  eventId: req.user?.eventId || "default-event",
  eventName: req.user?.eventName || "Default Event"
});

exports.createSession = async (req, res) => {
  try {
    const { customerName } = req.body;

    if (!customerName?.trim()) {
      return res.status(400).json({ message: "customerName is required" });
    }

    const sessionId = uuidv4();
    const { clubId, clubName, eventId, eventName } = getContext(req);
    const sessionKey = `session:${clubId}:${eventId}:${sessionId}`;

    await redisClient.hSet(sessionKey, {
      clubId,
      clubName,
      eventId,
      eventName,
      customerName: customerName.trim(),
      status: "ACTIVE",
      total: 0,
      entryTime: Date.now()
    });

    await redisClient.expire(sessionKey, process.env.SESSION_TTL);

    const qrCode = await QRCode.toDataURL(sessionId);

    await publishEvent("session.created", {
      sessionId,
      customerName: customerName.trim(),
      clubId,
      clubName,
      eventId,
      eventName
    });

    res.status(201).json({
      sessionId,
      qrCode
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Session creation failed" });
  }
};

exports.createDemoSession = async (req, res) => {
  try {
    const { customerName } = req.body;

    if (!customerName?.trim()) {
      return res.status(400).json({ message: "customerName is required" });
    }

    const sessionId = uuidv4();
    const { clubId, clubName, eventId, eventName } = getContext(req);
    const qrCode = await QRCode.toDataURL(sessionId);

    const demoSession = await DemoSession.create({
      sessionId,
      customerName: customerName.trim(),
      qrCode,
      clubId,
      clubName,
      eventId,
      eventName,
      createdById: req.user?.id || null,
      createdByName: req.user?.name || null,
      createdByRole: req.user?.role || null
    });

    res.status(201).json({
      message: "Demo session created",
      sessionId: demoSession.sessionId,
      customerName: demoSession.customerName,
      qrCode: demoSession.qrCode,
      createdAt: demoSession.createdAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Demo session creation failed" });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { clubId, eventId } = getContext(req);

    const session = await redisClient.hGetAll(`session:${clubId}:${eventId}:${sessionId}`);

    if (!session || Object.keys(session).length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: "Error fetching session" });
  }
};

exports.getActiveSessions = async (req, res) => {
  try {
    const { clubId, eventId } = getContext(req);
    const pattern = `session:${clubId}:${eventId}:*`;
    const keys = await redisClient.keys(pattern);

    if (!keys.length) {
      return res.json([]);
    }

    const sessions = [];
    for (const key of keys) {
      const data = await redisClient.hGetAll(key);
      if (!data || Object.keys(data).length === 0) continue;

      sessions.push({
        id: key.split(":").pop(),
        ...data,
        total: Number(data.total || 0),
        entryTime: Number(data.entryTime || 0)
      });
    }

    sessions.sort((a, b) => b.entryTime - a.entryTime);
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching active sessions" });
  }
};
