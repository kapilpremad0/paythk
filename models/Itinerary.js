// models/Itinerary.js
const mongoose = require("mongoose");

const itinerarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  notes: { type: String },

  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Itinerary", itinerarySchema);
