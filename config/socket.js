const { Server } = require("socket.io");
const Message = require("../models/Message");

let io;
let onlineUsers = {}; // userId -> socketId

function initSocket(server) {
    io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        // Register user online
        socket.on("register", (userId) => {
            onlineUsers[userId] = socket.id;
            console.log(`User ${userId} registered with socket ${socket.id}`);
        });

        // Send message
        socket.on("send_message", async ({ sender, receiver, text }) => {
            console.log(`Message from ${sender} -> ${receiver}: ${text}`);

            // Save in DB
            const message = await Message.create({ sender, receiver, text });

            // Emit to receiver if online
            const receiverSocketId = onlineUsers[receiver];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_message", message);
            }
        });

        // Mark message seen
        socket.on("mark_seen", async ({ messageId }) => {
            await Message.findByIdAndUpdate(messageId, { seen: true });
            console.log(`Message ${messageId} marked seen`);
        });

        // Disconnect
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
            Object.keys(onlineUsers).forEach(uid => {
                if (onlineUsers[uid] === socket.id) delete onlineUsers[uid];
            });
        });
    });

    return io;
}

module.exports = { initSocket };
