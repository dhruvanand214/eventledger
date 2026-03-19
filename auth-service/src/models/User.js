const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "owner", "manager", "entry", "bartender", "exit"],
      default: "bartender"
    },
    serviceType: {
      type: String,
      enum: ["one_time", "full_time"],
      default: "full_time"
    },
    isEventActive: { type: Boolean, default: true },
    clubId: { type: String, default: null },
    clubName: { type: String, default: null },
    eventId: { type: String, default: null },
    eventName: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
