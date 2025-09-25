const { Server } = require("socket.io");
const Message = require("../models/Message");
const Room = require("../models/Room");

let io;
let onlineUsers = {}; // userId -> socketId

function initSocket(server) {
    io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    io.on("connection", (socket) => {
        console.log("🟢 New client connected:", socket.id);

        // Register user as online
        socket.on("register", ({ userId }) => {
            onlineUsers[userId] = socket.id;
            console.log(`✅ User ${userId} registered with socket ${socket.id}`);
        });

        /**
         * Send a message inside a room
         * data: { roomId, senderId, content }
         */
        socket.on("send_message", async ({ roomId, senderId, content }) => {
            try {
                // Save message in DB
                const message = await Message.create({
                    roomId,
                    senderId,
                    content
                });

                // Update room lastMessage + unreadCounts
                const room = await Room.findById(roomId);
                if (!room) return;

                room.lastMessage = {
                    messageId: message._id,
                    content: message.content,
                    timestamp: message.createdAt
                };

                room.participantIds.forEach(userId => {
                    if (userId.toString() !== senderId.toString()) {
                        const current = room.unreadCounts.get(userId.toString()) || 0;
                        room.unreadCounts.set(userId.toString(), current + 1);
                    }
                });

                await room.save();

                // Confirm back to sender
                io.to(socket.id).emit("message_sent", message);

                // Emit to all participants (if online)
                room.participantIds.forEach(userId => {
                    const receiverSocketId = onlineUsers[userId.toString()];
                    if (receiverSocketId && userId.toString() !== senderId.toString()) {
                        io.to(receiverSocketId).emit("receive_message", {
                            roomId,
                            message
                        });
                    }
                });

            } catch (err) {
                console.error("Error saving message:", err);
                io.to(socket.id).emit("error_message", { error: "Message not sent" });
            }
        });

        /**
         * Mark messages as seen
         * data: { roomId, userId }
         */
        socket.on("mark_seen", async ({ roomId, userId }) => {
            try {
                // Reset unread count for this user
                const room = await Room.findById(roomId);
                if (!room) return;

                room.unreadCounts.set(userId.toString(), 0);
                await room.save();

                // Notify all participants that user has seen messages
                room.participantIds.forEach(pid => {
                    const sockId = onlineUsers[pid.toString()];
                    if (sockId) {
                        io.to(sockId).emit("messages_seen", {
                            roomId,
                            seenBy: userId
                        });
                    }
                });

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
