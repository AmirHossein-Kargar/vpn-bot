import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  username: { type: String, default: null },
  telegramId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, default: null },
  balance: { type: Number, default: 0 },
  successfulPayments: { type: Number, default: 0 },
  totalServices: { type: Number, default: 0 },
  hasReceivedTest: { type: Boolean, default: false },
  vpnId: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
