const jwt = require("jsonwebtoken");
const { redisClient } = require("../config/redis");

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token in Redis
    const storedToken = await redisClient.get(`auth:${decoded.id}`);

    if (!storedToken || storedToken !== token) {
      return res.status(401).json({ message: "Session expired or invalid" });
    }

    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

exports.logout = async (req, res) => {
  try {
    await redisClient.del(`auth:${req.user.id}`);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
};