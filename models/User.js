import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  balance: { type: Number, default: 0 },
  successfulPayments: { type: Number, default: 0 },
  totalServices: { type: Number, default: 0 },
  hasReceivedTest: {type: Boolean, default: false},
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
