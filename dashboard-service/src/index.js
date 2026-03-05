require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");

const { connectSubscriber, subscriber } = require("./redis/subscriber");
const { initSocket, emitEvent } = require("./socket/socketServer");

const app = express();
app.use(cors());

const server = http.createServer(app);

initSocket(server);

const startServer = async () => {

  await connectSubscriber();

  await subscriber.subscribe("order.created", (message) => {

    const data = JSON.parse(message);

    console.log("Order Event Received:", data);

    emitEvent("order.created", data);
  });

  await subscriber.subscribe("session.closed", (message) => {

    const data = JSON.parse(message);

    console.log("Session Closed Event:", data);

    emitEvent("session.closed", data);
  });

};

startServer();

server.listen(process.env.PORT, () => {
  console.log(`Dashboard service running on ${process.env.PORT}`);
});