const express = require('express');
const router = express.Router();
const Room = require('../../models/Room');
const Message = require('../../models/Message');


exports.getMyRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const rooms = await Room.find({ participantIds: userId })
      .populate("participantIds", "name imageUrls")
      .populate("lastMessage.messageId");

    return res.json(rooms);
  } catch (err) {
    console.error("getMyRooms error:", err.message);
    return res.status(500).json({ message: "Server Error" });
  }
};


exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 20 } = req.query; // default: page 1, 20 messages per page

    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalMessages = await Message.countDocuments({ roomId });

    res.status(200).json({
      success: true,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages,
      messages: messages.reverse(), // reverse so oldest → newest order
    });
  } catch (error) {
    console.error("getRoomMessages error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};