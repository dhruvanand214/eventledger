const mongoose = require("mongoose");

const sessionHistorySchema = new mongoose.Schema({
  clubId: String,
  clubName: String,
  eventId: String,
  eventName: String,
  sessionId: String,
  customerName: String,
  entryTime: Number,
  exitTime: Number,
  total: Number,
  paymentStatus: {
    type: String,
    default: "PAID"
  }
});

module.exports = mongoose.model("SessionHistory", sessionHistorySchema);
