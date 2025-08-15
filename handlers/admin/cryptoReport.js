import CryptoInvoice from "../../models/CryptoInvoice.js";

const cryptoReport = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    // دریافت آمار کریپتو
    const allCrypto = await CryptoInvoice.find({});
    const paidCrypto = await CryptoInvoice.find({ status: "paid" });
    const pendingCrypto = await CryptoInvoice.find({ status: "unpaid" });
    const rejectedCrypto = await CryptoInvoice.find({ status: "rejected" });

    // محاسبات کلی
    const totalCrypto = allCrypto.length;
    const paidSum = paidCrypto.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const pendingSum = pendingCrypto.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const rejectedSum = rejectedCrypto.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );

    // آمار بر اساس نوع کریپتو
    const cryptoByType = {};
    allCrypto.forEach((inv) => {
      const type = inv.paymentType || "unknown";
      if (!cryptoByType[type]) {
        cryptoByType[type] = {
          count: 0,
          amount: 0,
          paid: 0,
          pending: 0,
          rejected: 0,
        };
      }
      cryptoByType[type].count++;
      cryptoByType[type].amount += inv.amount || 0;

      if (inv.status === "paid") cryptoByType[type].paid++;
      else if (inv.status === "unpaid") cryptoByType[type].pending++;
      else if (inv.status === "rejected") cryptoByType[type].rejected++;
    });

    // آمار بر اساس مبلغ
    const smallPayments = paidCrypto.filter(
      (inv) => (inv.amount || 0) < 100000
    ).length;
    const mediumPayments = paidCrypto.filter(
      (inv) => (inv.amount || 0) >= 100000 && (inv.amount || 0) < 500000
    ).length;
    const largePayments = paidCrypto.filter(
      (inv) => (inv.amount || 0) >= 500000
    ).length;

    // نرخ تبدیل
    const conversionRate =
      paidCrypto.length > 0
        ? ((paidCrypto.length / totalCrypto) * 100).toFixed(1)
        : 0;

    const report =
      `💰 <b>گزارش کریپتو جامع</b>\n\n` +
      `📊 <b>آمار کلی:</b>\n` +
      `• کل فاکتورها: <code>${totalCrypto}</code>\n` +
      `• تایید شده: <code>${paidCrypto.length}</code>\n` +
      `• در انتظار: <code>${pendingCrypto.length}</code>\n` +
      `• رد شده: <code>${rejectedCrypto.length}</code>\n\n` +
      `💰 <b>مبالغ:</b>\n` +
      `• کل تایید شده: <code>${paidSum.toLocaleString()}</code> تومان\n` +
      `• در انتظار: <code>${pendingSum.toLocaleString()}</code> تومان\n` +
      `• رد شده: <code>${rejectedSum.toLocaleString()}</code> تومان\n\n` +
      `📈 <b>نرخ تبدیل:</b> <code>${conversionRate}%</code>\n\n` +
      `📊 <b>توزیع مبالغ:</b>\n` +
      `• کمتر از 100 هزار: <code>${smallPayments}</code>\n` +
      `• 100 هزار تا 500 هزار: <code>${mediumPayments}</code>\n` +
      `• بیشتر از 500 هزار: <code>${largePayments}</code>\n\n` +
      `🪙 <b>جزئیات بر اساس نوع:</b>\n` +
      Object.entries(cryptoByType)
        .map(
          ([type, stats]) =>
            `• ${type.toUpperCase()}: ${
              stats.count
            } فاکتور، ${stats.amount.toLocaleString()} تومان`
        )
        .join("\n") +
      "\n\n" +
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
            { text: "🏦 گزارش بانکی", callback_data: "admin_bank_report" },
            { text: "👥 گزارش کاربران", callback_data: "admin_users_report" },
          ],
          [{ text: "🏠 بازگشت", callback_data: "admin_financial_report" }],
        ],
      },
    });

    await bot.answerCallbackQuery(query.id, {
      text: "✅ گزارش کریپتو نمایش داده شد",
    });
  } catch (error) {
    console.error("❌ Error in crypto report:", error.message);

    await bot.editMessageText(
      `❌ خطا در نمایش گزارش کریپتو:\n\n<code>${error.message}</code>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 تلاش مجدد", callback_data: "admin_crypto_report" },
              { text: "🏠 بازگشت", callback_data: "admin_financial_report" },
            ],
          ],
        },
      }
    );

    await bot.answerCallbackQuery(query.id, {
      text: "❌ خطا در نمایش گزارش کریپتو",
      show_alert: true,
    });
  }
};

export default cryptoReport;
