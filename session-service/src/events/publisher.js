const { createClient } = require("redis");

const shouldUseTls =
  process.env.REDIS_TLS === "true" ||
  process.env.REDIS_URL?.startsWith("rediss://") ||
  process.env.REDIS_URL?.includes("upstash.io");
const normalizedRedisUrl =
  shouldUseTls && process.env.REDIS_URL?.startsWith("redis://")
    ? process.env.REDIS_URL.replace("redis://", "rediss://")
    : process.env.REDIS_URL;

const publisher = normalizedRedisUrl
  ? createClient({
      url: normalizedRedisUrl
    })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    });

publisher.connect().catch((error) => {
  console.error("Redis publisher connection error:", error);
});

const publishEvent = async (channel, data) => {
  await publisher.publish(channel, JSON.stringify(data));
};

module.exports = publishEvent;
