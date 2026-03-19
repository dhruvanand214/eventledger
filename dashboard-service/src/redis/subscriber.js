const { createClient } = require("redis");

const shouldUseTls =
  process.env.REDIS_TLS === "true" ||
  process.env.REDIS_URL?.startsWith("rediss://") ||
  process.env.REDIS_URL?.includes("upstash.io");
const normalizedRedisUrl =
  shouldUseTls && process.env.REDIS_URL?.startsWith("redis://")
    ? process.env.REDIS_URL.replace("redis://", "rediss://")
    : process.env.REDIS_URL;

const subscriber = normalizedRedisUrl
  ? createClient({
      url: normalizedRedisUrl
    })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    });

subscriber.on("error", (err) => {
  console.error("Redis Subscriber Error", err);
});

const connectSubscriber = async () => {
  await subscriber.connect();
  console.log("Dashboard Redis Subscriber Connected");
};

module.exports = { subscriber, connectSubscriber };
