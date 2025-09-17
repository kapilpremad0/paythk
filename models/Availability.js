const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, required: true }, // links to Rental/Hostel/Cafe/Guide
  parentType: { 
    type: String, 
    enum: ["Rental", "Hostel", "Cafe", "Guide"], 
    required: true 
  },
  day: { 
    type: String, 
    enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], 
    required: true 
  },
  open_time: { type: String, required: true },   // "09:00"
  close_time: { type: String, required: true },  // "18:00"
  price: { type: Number, required: true },
  late_fees: { type: Number, default: 0 },
  status: { type: String, enum: ["active","inactive"], default: "active" }, // ✅ New status field

}, { timestamps: true });

availabilitySchema.index({ parentId: 1, parentType: 1, day: 1 }, { unique: true });



module.exports = mongoose.model("Availability", availabilitySchema);
