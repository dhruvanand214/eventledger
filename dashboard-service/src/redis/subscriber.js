const { createClient } = require("redis");

const subscriber = createClient({
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