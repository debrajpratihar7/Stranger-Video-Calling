
const io = require("socket.io")(3001, {
  cors: { origin: "*" }
});

let queue = [];

io.on("connection", socket => {

  socket.on("join", () => {
    if (queue.length > 0) {
      const partner = queue.shift();

      io.to(partner).emit("matched", socket.id);
      socket.emit("matched", partner);
    } else {
      queue.push(socket.id);
    }
  });

  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice", ({ to, candidate }) => {
    io.to(to).emit("ice", { from: socket.id, candidate });
  });

  socket.on("disconnect", () => {
    queue = queue.filter(id => id !== socket.id);
  });
});
