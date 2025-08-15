import invoice from "../../models/invoice.js";

const bankReport = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    // دریافت آمار بانکی
    const allBankInvoices = await invoice.find({});
    const confirmedBank = await invoice.find({
      status: { $in: ["paid", "confirmed"] },
    });
    const pendingBank = await invoice.find({ status: "pending" });
    const rejectedBank = await invoice.find({ status: "rejected" });

    // محاسبات
    const totalBank = allBankInvoices.length;
    const confirmedSum = confirmedBank.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const pendingSum = pendingBank.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const rejectedSum = rejectedBank.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );

    // آمار بر اساس مبلغ
    const smallPayments = confirmedBank.filter(
      (inv) => (inv.amount || 0) < 100000
    ).length;
    const mediumPayments = confirmedBank.filter(
      (inv) => (inv.amount || 0) >= 100000 && (inv.amount || 0) < 500000
    ).length;
    const largePayments = confirmedBank.filter(
      (inv) => (inv.amount || 0) >= 500000
    ).length;

    const report =
      `🏦 <b>گزارش بانکی جامع</b>\n\n` +
      `📊 <b>آمار کلی:</b>\n` +
      `• کل فاکتورها: <code>${totalBank}</code>\n` +
      `• تایید شده: <code>${confirmedBank.length}</code>\n` +
      `• در انتظار: <code>${pendingBank.length}</code>\n` +
      `• رد شده: <code>${rejectedBank.length}</code>\n\n` +
      `💰 <b>مبالغ:</b>\n` +
      `• کل تایید شده: <code>${confirmedSum.toLocaleString()}</code> تومان\n` +
      `• در انتظار: <code>${pendingSum.toLocaleString()}</code> تومان\n` +
      `• رد شده: <code>${rejectedSum.toLocaleString()}</code> تومان\n\n` +
      `📈 <b>توزیع مبالغ:</b>\n` +
      `• کمتر از 100 هزار: <code>${smallPayments}</code>\n` +
      `• 100 هزار تا 500 هزار: <code>${mediumPayments}</code>\n` +
      `• بیشتر از 500 هزار: <code>${largePayments}</code>\n\n` +
      `📅 <b>آخرین بروزرسانی:</b> ${new Date().toLocaleString("fa-IR")}`;

    await bot.editMessageText(report, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📊 جزئیات بیشتر",
              callback_data: "admin_detailed_financial",
            },
            { text: "📅 گزارش ماهانه", callback_data: "admin_monthly_report" },
          ],
          [
            { text: "💰 گزارش کریپتو", callback_data: "admin_crypto_report" },
            { text: "👥 گزارش کاربران", callback_data: "admin_users_report" },
          ],
          [{ text: "🏠 بازگشت", callback_data: "admin_financial_report" }],
        ],
      },
    });

    await bot.answerCallbackQuery(query.id, {
      text: "✅ گزارش بانکی نمایش داده شد",
    });
  } catch (error) {
    console.error("❌ Error in bank report:", error.message);

    await bot.editMessageText(
      `❌ خطا در نمایش گزارش بانکی:\n\n<code>${error.message}</code>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 تلاش مجدد", callback_data: "admin_bank_report" },
              { text: "🏠 بازگشت", callback_data: "admin_financial_report" },
            ],
          ],
        },
      }
    );

    await bot.answerCallbackQuery(query.id, {
      text: "❌ خطا در نمایش گزارش بانکی",
      show_alert: true,
    });
  }
};

export default bankReport;
