const { createClient } = require("redis");

const redisClient = createClient({
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