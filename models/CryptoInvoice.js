import mongoose from "mongoose";

const cryptoInvoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true },
  userId: { type: Number, required: true },
  amount: { type: Number, required: true }, // مبلغ تومانی
  usdAmount: { type: Number, required: true }, // مبلغ دلاری
  cryptoAmount: { type: Number, required: true }, // مبلغ ارز دیجیتال (مثل TRX)
  currency: { type: String, required: true },
  paymentType: {
    type: String,
    enum: ["trx", "ton", "usdt", "btc", "eth"],
    default: "trx",
  },
  status: {
    type: String,
    enum: ["unpaid", "paid", "rejected"],
    default: "unpaid",
  },
  transactionHash: { type: String },
  confirmedAt: { type: Date },
  rejectedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const CryptoInvoice = mongoose.model("CryptoInvoice", cryptoInvoiceSchema);
export default CryptoInvoice;
