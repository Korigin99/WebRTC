const express = require("express");
const https = require("https");
const fs = require("fs");
const socketIO = require("socket.io");

const app = express();
const server = https.createServer(
  {
    key: fs.readFileSync("./cert/key.pem"),
    cert: fs.readFileSync("./cert/cert.pem"),
  },
  app
);
const io = socketIO(server);

io.on("connection", (socket) => {
  console.log("New user connected");

  // Offer를 받았을 때 다른 클라이언트에게 전달
  socket.on("offer", (offer) => {
    socket.broadcast.emit("offer", offer);
  });

  // Answer를 받았을 때 다른 클라이언트에게 전달
  socket.on("answer", (answer) => {
    socket.broadcast.emit("answer", answer);
  });

  // ICE candidate를 받았을 때 다른 클라이언트에게 전달
  socket.on("candidate", (candidate) => {
    socket.broadcast.emit("candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
