const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., "guest_commission"
  value: { type: mongoose.Schema.Types.Mixed, required: true }, // can be number, string, json
  description: { type: String } // optional, to explain what the setting is for
}, { timestamps: true });

module.exports = mongoose.model("Setting", settingSchema);
