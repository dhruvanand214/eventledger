const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { redisClient, ensureRedisConnected } = require("../config/redis");

const SALT_ROUNDS = 10;
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      name: user.name,
      role: user.role,
      serviceType: user.serviceType,
      isEventActive: user.isEventActive,
      clubId: user.clubId || null,
      clubName: user.clubName || null,
      eventId: user.eventId || null,
      eventName: user.eventName || null
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

const saveSessionToken = async (userId, token) => {
  await ensureRedisConnected();
  await redisClient.set(`auth:${userId}`, token, {
    EX: TOKEN_TTL_SECONDS
  });
};

const slugifyClubId = (name) => {
  const base = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "club";
};

const generateUniqueClubId = async (clubName) => {
  const base = slugifyClubId(clubName);
  let candidate = base;
  let suffix = 1;

  while (await User.exists({ clubId: candidate })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const createInitialEventForOneTimeClub = (clubId, clubName) => {
  const safeClubId = clubId || "club";
  const safeClubName = clubName || "Event";
  return {
    eventId: `${safeClubId}-event-${Date.now()}`,
    eventName: `${safeClubName} Opening Event`
  };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, clubName, serviceType } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const allowedRoles = ["entry", "bartender", "exit", "owner"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const creator = await User.findById(req.user.id).select(
      "role serviceType isEventActive clubId clubName eventId eventName"
    );
    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    let targetClubId = null;
    let targetClubName = null;
    let targetEventId = null;
    let targetEventName = null;
    let targetServiceType = "full_time";
    let targetIsEventActive = true;

    if (creator.role === "admin") {
      if (role !== "owner") {
        return res.status(403).json({ message: "Admin can create owner only. Owner will create staff." });
      }

      const normalizedClubName = clubName?.trim();
      if (!normalizedClubName) {
        return res.status(400).json({ message: "clubName is required for owner creation" });
      }

      const normalizedServiceType = serviceType === "one_time" ? "one_time" : "full_time";
      targetClubName = normalizedClubName;
      targetClubId = await generateUniqueClubId(normalizedClubName);
      targetServiceType = normalizedServiceType;
      targetIsEventActive = true;

      if (normalizedServiceType === "one_time") {
        const initialEvent = createInitialEventForOneTimeClub(targetClubId, targetClubName);
        targetEventId = initialEvent.eventId;
        targetEventName = initialEvent.eventName;
      }
    } else if (creator.role === "owner") {
      if (role === "owner") {
        return res.status(403).json({ message: "Owner cannot create another owner" });
      }

      if (!creator.clubId || !creator.clubName) {
        return res.status(400).json({ message: "Owner club not configured" });
      }

      targetClubId = creator.clubId;
      targetClubName = creator.clubName;
      targetEventId = creator.eventId || null;
      targetEventName = creator.eventName || null;
      targetServiceType = creator.serviceType || "full_time";
      targetIsEventActive = Boolean(creator.isEventActive);
    } else {
      return res.status(403).json({ message: "Not allowed to create users" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      serviceType: targetServiceType,
      isEventActive: targetIsEventActive,
      clubId: targetClubId,
      clubName: targetClubName,
      eventId: targetEventId,
      eventName: targetEventName,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "User created",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        serviceType: user.serviceType,
        isEventActive: user.isEventActive,
        clubId: user.clubId,
        clubName: user.clubName,
        eventId: user.eventId,
        eventName: user.eventName
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.serviceType === "one_time" && !user.isEventActive && user.role !== "owner") {
      return res.status(403).json({ message: "Event is closed. Wait for owner to start a new event." });
    }

    const token = signToken(user);
    await saveSessionToken(user._id, token);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        serviceType: user.serviceType,
        isEventActive: user.isEventActive,
        clubId: user.clubId || null,
        clubName: user.clubName || null,
        eventId: user.eventId || null,
        eventName: user.eventName || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.bindEvent = async (req, res) => {
  try {
    const { eventId, eventName } = req.body;

    const normalizedEventId = eventId?.trim();
    const normalizedEventName = eventName?.trim();

    if (!normalizedEventId || !normalizedEventName) {
      return res.status(400).json({ message: "eventId and eventName are required" });
    }

    const currentUser = await User.findById(req.user.id).select("clubId clubName role");
    if (!currentUser?.clubId || !currentUser?.clubName) {
      return res.status(400).json({ message: "Club is required before binding event" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { eventId: normalizedEventId, eventName: normalizedEventName, isEventActive: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.updateMany(
      { clubId: user.clubId },
      { eventId: normalizedEventId, eventName: normalizedEventName, isEventActive: true }
    );

    const token = signToken(user);
    await saveSessionToken(user._id, token);

    res.json({
      message: "Event bound successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        serviceType: user.serviceType,
        isEventActive: user.isEventActive,
        clubId: user.clubId,
        clubName: user.clubName,
        eventId: user.eventId,
        eventName: user.eventName
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to bind event" });
  }
};
