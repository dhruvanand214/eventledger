const { createClient } = require("redis");

const shouldUseTls =
  process.env.REDIS_TLS === "true" ||
  process.env.REDIS_URL?.startsWith("rediss://") ||
  process.env.REDIS_URL?.includes("upstash.io");
const normalizedRedisUrl =
  shouldUseTls && process.env.REDIS_URL?.startsWith("redis://")
    ? process.env.REDIS_URL.replace("redis://", "rediss://")
    : process.env.REDIS_URL;

const redisClient = normalizedRedisUrl
  ? createClient({
      url: normalizedRedisUrl
    })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        keepAlive: 5000,
        connectTimeout: 10000,
        reconnectStrategy: (retries) => Math.min(retries * 200, 3000)
      }
    });

redisClient.on("error", (err) => console.error("Redis Error", err));

const connectRedis = async () => {
  if (redisClient.isOpen) return;
  await redisClient.connect();
  console.log("Exit Redis Connected");
};

const ensureRedisConnected = async () => {
  if (!redisClient.isOpen) {
    await connectRedis();
  }
};

module.exports = { redisClient, connectRedis, ensureRedisConnected };
