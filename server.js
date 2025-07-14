const express = require("express");
const app = express();
const Payment = require("./models/Payemnts");
const bot = require("./bot");

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
