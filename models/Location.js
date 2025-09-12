const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  state: String,
  stateCode: String,
  city: String,
  country: String
});

LocationSchema.index({ stateCode: 1, city: 1 }, { unique: true });
module.exports = mongoose.model('Location', LocationSchema);
