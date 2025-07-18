import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true },
  userId: {type: Number, required: true},
  amount: {type: Number, required: true},
  usdAmount: {type: Number, required: true},
  cryptoAmount: {type: Number, required: true},
  currency: {type: String, default: 'USD'},
  invoiceUrl: {type: String, required: true},
  status: {type: String, enum: ['pending', 'paid', 'expired'], default: 'pending'},
  createdAt: {type: Date, default: Date.now},
  paidAt: {type: Date, default: null}
});

export default mongoose.model('payment', paymentSchema);