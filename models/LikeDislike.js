const mongoose = require("mongoose");

const LikeDislikeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // the user performing the action

  buddyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // the user being liked/disliked

  action: { 
    type: String, 
    enum: ["like", "dislike"], 
    required: true 
  },

  createdAt: { type: Date, default: Date.now }
});

// 🔹 Ensure a user can only like/dislike another user once
LikeDislikeSchema.index({ userId: 1, buddyId: 1 }, { unique: true });

module.exports = mongoose.model("LikeDislike", LikeDislikeSchema);
