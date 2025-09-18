const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  type: { type: String, enum: ["private", "group"], required: true },
  name: { type: String, default: null }, // only for groups
  participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessage: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    content: { type: String },
    timestamp: { type: Date }
  },
  unreadCounts: {
    type: Map,
    of: Number, // { userId: count }
    default: {}
  },
  archived: { type: Boolean, default: false }
}, { timestamps: true }); // adds createdAt & updatedAt

module.exports = mongoose.model("Room", RoomSchema);
