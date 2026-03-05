const mongoose = require("mongoose");

const sessionHistorySchema = new mongoose.Schema({
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