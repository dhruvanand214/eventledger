const mongoose = require("mongoose");

const menuCategorySchema = new mongoose.Schema(
  {
    clubId: { type: String, required: true, trim: true },
    eventId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    createdBy: { type: String, default: null }
  },
  { timestamps: true }
);

menuCategorySchema.index({ clubId: 1, eventId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("MenuCategory", menuCategorySchema);
