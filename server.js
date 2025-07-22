import express from "express";
import Payment from "./models/Payemnts.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(`/api/nowpayments/webhook`, async (req, res) => {
  console.log(`WebHook received: ${JSON.stringify(req.body, null, 2)}`);
  res.sendStatus(200);

  const invoice = await Payment.findOne({ invoiceId: payload.invoice_id });

  if (
    invoice &&
    invoice.status === `pending` &&
    payload.payment_status === `finished`
  ) {
    invoice.status = "paid";
    await invoice.save();
  }

  // * find user and increse user balance =>
});

export default app;
