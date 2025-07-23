import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["unpaid", "paid", "rejected"],
    default: "unpaid",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const invoice = mongoose.model("invoice", invoiceSchema);
export default invoice;
