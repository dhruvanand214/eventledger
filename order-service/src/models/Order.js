const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  clubId: String,
  clubName: String,
  eventId: String,
  eventName: String,
  addedById: String,
  addedByName: String,
  sessionId: String,
  itemName: String,
  price: Number,
  quantity: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);
