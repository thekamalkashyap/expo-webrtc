const { Server } = require("socket.io");

const io = new Server({
  cors: true,
});

const uidToSocketMapping = new Map();
const socketToUidMapping = new Map();

io.on("connection", (socket) => {
  console.log("New Connection");
  // signaling code
  socket.on("join-room", (data) => {
    const { roomId, uid } = data;
    console.log("User", uid, "Joined Room", roomId);
    uidToSocketMapping.set(uid, socket.id); // store the socket id against the email id
    socketToUidMapping.set(socket.id, uid); // store the email id against the socket id
    socket.join(roomId); // join the room
    socket.emit("joined-room", { roomId, uid });
    socket.broadcast.to(roomId).emit("user-joined", { uid, roomId }); // broadcast to the room that a new user has joined
  });

  socket.on("call-user", (data) => {
    const { uid, offer } = data;
    const fromUid = socketToUidMapping.get(socket.id);
    const socketId = uidToSocketMapping.get(uid);
    socket.to(socketId).emit("incomming-call", { fromUid, offer });
  });

  socket.on("call-accepted", (data) => {
    const { uid, answer } = data;
    const socketId = uidToSocketMapping.get(uid);
    socket.to(socketId).emit("call-accepted", { answer });
  });
});

io.listen(5000);
