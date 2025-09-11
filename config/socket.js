const { Server } = require("socket.io");
const Message = require("../models/Message");

let io;
let onlineUsers = {}; // userId -> socketId

function initSocket(server) {
    io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    io.on("connection", (socket) => {
        console.log("🟢 New client connected:", socket.id);

        // Register user as online
        socket.on("register", ({userId}) => {
            onlineUsers[userId] = socket.id;
            console.log(`✅ User ${userId} registered with socket ${socket.id}`);
        });

        // Send message
        socket.on("send_message", async ({ sender, receiver, text }) => {
            console.log(`✉️ ${sender} -> ${receiver}: ${text}`);

            try {
                // Save message in DB
                const message = await Message.create({
                    sender,
                    receiver,
                    text,
                    seen: false
                });

                // Send back confirmation to sender
                io.to(socket.id).emit("message_sent", message);

                // Emit to receiver if online
                const receiverSocketId = onlineUsers[receiver];
                console.log(receiverSocketId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message);
                }
            } catch (err) {
                console.error("Error saving message:", err);
                io.to(socket.id).emit("error_message", { error: "Message not sent" });
            }
        });

        // Mark message as seen
        socket.on("mark_seen", async ({ messageId, userId }) => {
            try {
                const updated = await Message.findByIdAndUpdate(
                    messageId,
                    { seen: true },
                    { new: true }
                );

                if (updated) {
                    console.log(`👁️ Message ${messageId} marked seen`);

                    // Notify sender that receiver saw the message
                    const senderSocketId = onlineUsers[updated.sender];
                    if (senderSocketId) {
                        io.to(senderSocketId).emit("message_seen", {
                            messageId: updated._id,
                            seenBy: userId
                        });
                    }
                }
            } catch (err) {
                console.error("Error marking seen:", err);
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("🔴 Client disconnected:", socket.id);
            Object.keys(onlineUsers).forEach(uid => {
                if (onlineUsers[uid] === socket.id) {
                    delete onlineUsers[uid];
                    console.log(`❌ User ${uid} went offline`);
                }
            });
        });
    });

    return io;
}

module.exports = { initSocket };
