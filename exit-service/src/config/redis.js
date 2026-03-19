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
        port: process.env.REDIS_PORT
      }
    });

redisClient.on("error", (err) => console.error("Redis Error", err));

const connectRedis = async () => {
  await redisClient.connect();
  console.log("Exit Redis Connected");
};

module.exports = { redisClient, connectRedis };
