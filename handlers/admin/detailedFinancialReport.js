import CryptoInvoice from "../../models/CryptoInvoice.js";
import invoice from "../../models/invoice.js";
import User from "../../models/User.js";

const detailedFinancialReport = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    // دریافت آمار کامل
    const paidCrypto = await CryptoInvoice.find({ status: "paid" });
    const confirmedBank = await invoice.find({
      status: { $in: ["paid", "confirmed"] },
    });
    const allUsers = await User.find({});

    // محاسبات جزئیات
    const cryptoByType = {};
    paidCrypto.forEach((inv) => {
      const type = inv.paymentType || "unknown";
      if (!cryptoByType[type]) cryptoByType[type] = 0;
      cryptoByType[type] += inv.amount || 0;
    });

    const bankByStatus = {};
    confirmedBank.forEach((inv) => {
      const status = inv.status;
      if (!bankByStatus[status]) bankByStatus[status] = 0;
      bankByStatus[status] += inv.amount || 0;
    });

    // آمار کاربران
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u) => u.balance > 0).length;
    const totalBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
    const avgBalance = totalUsers > 0 ? totalBalance / totalUsers : 0;

    const report =
      `📊 <b>گزارش مالی جزئیات</b>\n\n` +
      `💰 <b>جزئیات کریپتو:</b>\n` +
      Object.entries(cryptoByType)
        .map(
          ([type, amount]) =>
            `• ${type.toUpperCase()}: <code>${amount.toLocaleString()}</code> تومان`
        )
        .join("\n") +
      "\n\n" +
      `🏦 <b>جزئیات بانکی:</b>\n` +
      Object.entries(bankByStatus)
        .map(
          ([status, amount]) =>
            `• ${status}: <code>${amount.toLocaleString()}</code> تومان`
        )
        .join("\n") +
      "\n\n" +
      `👥 <b>آمار کاربران:</b>\n` +
      `• کل کاربران: <code>${totalUsers}</code>\n` +
      `• کاربران فعال: <code>${activeUsers}</code>\n` +
      `• متوسط موجودی: <code>${avgBalance.toLocaleString()}</code> تومان\n` +
      `• کل موجودی: <code>${totalBalance.toLocaleString()}</code> تومان`;

    await bot.editMessageText(report, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📅 گزارش ماهانه", callback_data: "admin_monthly_report" },
            { text: "💰 گزارش کریپتو", callback_data: "admin_crypto_report" },
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
      text: "✅ گزارش مالی جزئیات نمایش داده شد",
    });
  } catch (error) {
    console.error("❌ Error in detailed financial report:", error.message);

    await bot.editMessageText(
      `❌ خطا در نمایش گزارش مالی جزئیات:\n\n<code>${error.message}</code>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 تلاش مجدد",
                callback_data: "admin_detailed_financial",
              },
              { text: "🏠 بازگشت", callback_data: "admin_back_to_panel" },
            ],
          ],
        },
      }
    );

    await bot.answerCallbackQuery(query.id, {
      text: "❌ خطا در نمایش گزارش مالی جزئیات",
      show_alert: true,
    });
  }
};

export default detailedFinancialReport;
