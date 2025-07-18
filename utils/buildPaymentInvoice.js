const buildPaymentInvoice = (params) => {
  return `
✅ <b>فاکتور پرداخت ${params.invoiceId}</b>

�� <b>مقدار ${params.cryptoSymbol.toUpperCase()}:</b> <code>${params.cryptoAmtNum.toFixed(
    2
  )} ${params.cryptoSymbol.toUpperCase()}</code>
💸 <b>مبلغ:</b> <code>${params.amount.toLocaleString()} تومان</code>
💵 <b>معادل دلاری:</b> <code>$${params.usdAmount.toFixed(2)}</code>

📌 پس از پرداخت، موجودی شما به میزان <b>${params.amount.toLocaleString()} تومان</b> افزایش خواهد یافت.
⏱ تأیید پرداخت حداکثر تا ۵ دقیقه به‌صورت خودکار انجام می‌شود.

👈 لطفاً با دکمه زیر پرداخت کنید.
`;
};

export default buildPaymentInvoice;
