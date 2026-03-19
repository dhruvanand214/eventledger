const { redisClient } = require("../config/redis");
const SessionHistory = require("../models/SessionHistory");
const publishEvent = require("../events/publisher");

const getContext = (req) => ({
  clubId: req.user?.clubId || "default-club",
  clubName: req.user?.clubName || "Default Club",
  eventId: req.user?.eventId || "default-event",
  eventName: req.user?.eventName || "Default Event"
});

exports.closeSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const { clubId, clubName, eventId, eventName } = getContext(req);

    const sessionKey = `session:${clubId}:${eventId}:${sessionId}`;
    const session = await redisClient.hGetAll(sessionKey);

    if (!session || Object.keys(session).length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const total = parseInt(session.total, 10);

    const record = await SessionHistory.create({
      clubId,
      clubName,
      eventId,
      eventName,
      sessionId,
      customerName: session.customerName,
      entryTime: session.entryTime,
      exitTime: Date.now(),
      total
    });

    await redisClient.del(sessionKey);

    await publishEvent("session.closed", {
      sessionId,
      total,
      clubId,
      clubName,
      eventId,
      eventName
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

exports.getEventHistorySummary = async (req, res) => {
  try {
    const clubId = req.user?.clubId || "default-club";

    const summary = await SessionHistory.aggregate([
      { $match: { clubId } },
      {
        $group: {
          _id: {
            eventId: { $ifNull: ["$eventId", "unknown"] },
            eventName: { $ifNull: ["$eventName", "Unknown Event"] }
          },
          sessions: { $sum: 1 },
          revenue: { $sum: "$total" },
          lastExitTime: { $max: "$exitTime" }
        }
      },
      { $sort: { lastExitTime: -1 } }
    ]);

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch event summaries" });
  }
};

exports.getDailySummary = async (req, res) => {
  try {
    const clubId = req.user?.clubId || "default-club";
    const eventId = req.user?.eventId || null;
    const match = eventId ? { clubId, eventId } : { clubId };

    const summary = await SessionHistory.aggregate([
      { $match: match },
      {
        $addFields: {
          durationMs: { $subtract: ["$exitTime", "$entryTime"] },
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $toDate: "$exitTime" }
            }
          }
        }
      },
      {
        $group: {
          _id: "$day",
          sessions: { $sum: 1 },
          revenue: { $sum: "$total" },
          avgDurationMs: { $avg: "$durationMs" }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch daily summary" });
  }
};
