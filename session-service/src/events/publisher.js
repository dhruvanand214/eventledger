const { createClient } = require("redis");

const publisher = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

publisher.connect();

const publishEvent = async (channel, data) => {
  await publisher.publish(channel, JSON.stringify(data));
};

module.exports = publishEvent;