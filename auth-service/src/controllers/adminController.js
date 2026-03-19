const { redisClient } = require("../config/redis");
const User = require("../models/User");

exports.closeEvent = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    const owner = await User.findById(req.user.id).select("clubId serviceType");
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    if (owner.serviceType !== "one_time") {
      return res.status(400).json({ message: "End event is available for one-time events only" });
    }

    if (!owner.clubId) {
      return res.status(400).json({ message: "Club not configured" });
    }

    const usersInClub = await User.find({ clubId: owner.clubId }).select("_id");

    await User.updateMany(
      { clubId: owner.clubId },
      { isEventActive: false, eventId: null, eventName: null }
    );

    if (usersInClub.length > 0) {
      const keys = usersInClub.map((u) => `auth:${u._id}`);
      await redisClient.del(keys);
    }

    res.json({ message: "Event closed for this club. Staff logged out." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
