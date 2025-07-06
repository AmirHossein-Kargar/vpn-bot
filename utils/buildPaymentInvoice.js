const buildPaymentInvoice = ({
  amount,
  usdAmount,
  cryptoSymbol,
  cryptoAmtNum,
  invoiceId
}) => {
  return `
✅ <b>فاکتور پرداخت</b>

<b>🆔 شناسه فاکتور:</b> <code>${invoiceId}</code>

💠 <b>مقدار ${cryptoSymbol.toUpperCase()}:</b> <code>${cryptoAmtNum.toFixed(2)} ${cryptoSymbol.toUpperCase()}</code>
💸 <b>مبلغ:</b> <code>${amount.toLocaleString()} تومان</code>
💵 <b>معادل دلاری:</b> <code>$${usdAmount.toFixed(2)}</code>

📌 پس از پرداخت، موجودی شما به میزان <b>${amount.toLocaleString()} تومان</b> افزایش خواهد یافت.
⏱ تایید پرداخت حداکثر تا ۵ دقیقه بصورت خودکار انجام می‌شود.

👈 لطفاً با دکمه زیر پرداخت کنید.
`;

};
module.exports = buildPaymentInvoice;