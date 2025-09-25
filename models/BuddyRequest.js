const mongoose = require("mongoose");

const BuddyRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected"], 
    default: "pending" 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// One request per user pair
BuddyRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

module.exports = mongoose.model("BuddyRequest", BuddyRequestSchema);
