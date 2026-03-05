const { Server } = require("socket.io");

let io;

const initSocket = (server) => {

  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

};

const emitEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = { initSocket, emitEvent };