const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    clubId: { type: String, required: true, trim: true },
    eventId: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    itemName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    createdBy: { type: String, default: null }
  },
  { timestamps: true }
);

menuItemSchema.index({ clubId: 1, eventId: 1, category: 1, itemName: 1 }, { unique: true });

module.exports = mongoose.model("MenuItem", menuItemSchema);
