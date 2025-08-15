import User from "../../models/User.js";

const usersReport = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    // دریافت آمار کاربران
    const allUsers = await User.find({});
    const activeUsers = allUsers.filter((u) => u.balance > 0);
    const inactiveUsers = allUsers.filter((u) => u.balance === 0);
    const premiumUsers = allUsers.filter((u) => (u.totalServices || 0) > 0);

    // محاسبات
    const totalUsers = allUsers.length;
    const totalBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
    const avgBalance = totalUsers > 0 ? totalBalance / totalUsers : 0;
    const totalServices = allUsers.reduce(
      (sum, u) => sum + (u.totalServices || 0),
      0
    );
    const totalPayments = allUsers.reduce(
      (sum, u) => sum + (u.successfulPayments || 0),
      0
    );

    // آمار بر اساس موجودی
    const lowBalance = allUsers.filter(
      (u) => (u.balance || 0) > 0 && (u.balance || 0) < 50000
    ).length;
    const mediumBalance = allUsers.filter(
      (u) => (u.balance || 0) >= 50000 && (u.balance || 0) < 200000
    ).length;
    const highBalance = allUsers.filter(
      (u) => (u.balance || 0) >= 200000
    ).length;

    // کاربران جدید (آخرین 30 روز)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = allUsers.filter(
      (u) => u.createdAt && new Date(u.createdAt) > thirtyDaysAgo
    ).length;

    const report =
      `👥 <b>گزارش کاربران جامع</b>\n\n` +
      `📊 <b>آمار کلی:</b>\n` +
      `• کل کاربران: <code>${totalUsers}</code>\n` +
      `• کاربران فعال: <code>${activeUsers.length}</code>\n` +
      `• کاربران غیرفعال: <code>${inactiveUsers.length}</code>\n` +
      `• کاربران پریمیوم: <code>${premiumUsers.length}</code>\n\n` +
      `💰 <b>موجودی‌ها:</b>\n` +
      `• کل موجودی: <code>${totalBalance.toLocaleString()}</code> تومان\n` +
      `• متوسط موجودی: <code>${avgBalance.toLocaleString()}</code> تومان\n\n` +
      `📈 <b>توزیع موجودی:</b>\n` +
      `• کم (0-50 هزار): <code>${lowBalance}</code>\n` +
      `• متوسط (50-200 هزار): <code>${mediumBalance}</code>\n` +
      `• بالا (200 هزار+): <code>${highBalance}</code>\n\n` +
      `🛒 <b>سرویس‌ها:</b>\n` +
      `• کل سرویس‌ها: <code>${totalServices}</code>\n` +
      `• کل پرداخت‌ها: <code>${totalPayments}</code>\n\n` +
      `🆕 <b>کاربران جدید:</b>\n` +
      `• 30 روز اخیر: <code>${newUsers}</code>\n\n` +
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
            { text: "🏦 گزارش بانکی", callback_data: "admin_bank_report" },
          ],
          [{ text: "🏠 بازگشت", callback_data: "admin_financial_report" }],
        ],
      },
    });

    await bot.answerCallbackQuery(query.id, {
      text: "✅ گزارش کاربران نمایش داده شد",
    });
  } catch (error) {
    console.error("❌ Error in users report:", error.message);

    await bot.editMessageText(
      `❌ خطا در نمایش گزارش کاربران:\n\n<code>${error.message}</code>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 تلاش مجدد", callback_data: "admin_users_report" },
              { text: "🏠 بازگشت", callback_data: "admin_financial_report" },
            ],
          ],
        },
      }
    );

    await bot.answerCallbackQuery(query.id, {
      text: "❌ خطا در نمایش گزارش کاربران",
      show_alert: true,
    });
  }
};

export default usersReport;
