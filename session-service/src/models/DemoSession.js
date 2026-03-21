const mongoose = require("mongoose");

const demoSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    qrCode: { type: String, required: true },
    clubId: { type: String, default: "default-club" },
    clubName: { type: String, default: "Default Club" },
    eventId: { type: String, default: "default-event" },
    eventName: { type: String, default: "Default Event" },
    createdById: { type: String, default: null },
    createdByName: { type: String, default: null },
    createdByRole: { type: String, default: null }
  },
  {
    timestamps: true,
    collection: "demosession"
  }
);

module.exports = mongoose.model("DemoSession", demoSessionSchema);
