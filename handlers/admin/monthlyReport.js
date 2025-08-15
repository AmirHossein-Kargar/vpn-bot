import CryptoInvoice from "../../models/CryptoInvoice.js";
import invoice from "../../models/invoice.js";
import User from "../../models/User.js";

const monthlyReport = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    // محاسبه تاریخ‌های ماه جاری
    const now = new Date();

    // تبدیل تاریخ میلادی به شمسی
    const persianDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(now);

    const persianYear = parseInt(
      persianDate.find((part) => part.type === "year").value
    );
    const persianMonth = parseInt(
      persianDate.find((part) => part.type === "month").value
    );

    // محاسبه تاریخ‌های شروع و پایان ماه شمسی
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // آمار ماه جاری
    const monthlyCrypto = await CryptoInvoice.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const monthlyBank = await invoice.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const monthlyUsers = await User.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // محاسبات ماهانه
    const cryptoSum = monthlyCrypto.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const bankSum = monthlyBank.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const totalMonthly = cryptoSum + bankSum;
    const newUsers = monthlyUsers.length;

    // آمار ماه قبل برای مقایسه
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    );

    const lastMonthCrypto = await CryptoInvoice.find({
      createdAt: { $gte: lastMonth, $lte: endOfLastMonth },
    });
    const lastMonthBank = await invoice.find({
      createdAt: { $gte: lastMonth, $lte: endOfLastMonth },
    });
    const lastMonthUsers = await User.find({
      createdAt: { $gte: lastMonth, $lte: endOfLastMonth },
    });

    const lastMonthTotal =
      lastMonthCrypto.reduce((sum, inv) => sum + (inv.amount || 0), 0) +
      lastMonthBank.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const lastMonthUsersCount = lastMonthUsers.length;

    // محاسبه درصد تغییرات
    const revenueChange =
      lastMonthTotal > 0
        ? (((totalMonthly - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1)
        : 0;
    const usersChange =
      lastMonthUsersCount > 0
        ? (
            ((newUsers - lastMonthUsersCount) / lastMonthUsersCount) *
            100
          ).toFixed(1)
        : 0;

    // نام ماه‌ها (شمسی)
    const monthNames = [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ];

    const report =
      `📅 <b>گزارش ماهانه ${
        monthNames[persianMonth - 1]
      } ${persianYear}</b>\n\n` +
      `💰 <b>درآمد ماه جاری:</b>\n` +
      `• کل درآمد: <code>${totalMonthly.toLocaleString()}</code> تومان\n` +
      `• کریپتو: <code>${cryptoSum.toLocaleString()}</code> تومان\n` +
      `• بانکی: <code>${bankSum.toLocaleString()}</code> تومان\n\n` +
      `👥 <b>کاربران جدید:</b>\n` +
      `• ماه جاری: <code>${newUsers}</code>\n` +
      `• ماه قبل: <code>${lastMonthUsersCount}</code>\n` +
      `• تغییر: <code>${usersChange}%</code>\n\n` +
      `📊 <b>مقایسه با ماه قبل:</b>\n` +
      `• درآمد ماه قبل: <code>${lastMonthTotal.toLocaleString()}</code> تومان\n` +
      `• تغییر درآمد: <code>${revenueChange}%</code>\n\n` +
      `📈 <b>روند:</b>\n` +
      `• وضعیت درآمد: ${
        revenueChange > 0
          ? "📈 افزایش"
          : revenueChange < 0
          ? "📉 کاهش"
          : "➡️ ثابت"
      }\n` +
      `• وضعیت کاربران: ${
        usersChange > 0 ? "📈 افزایش" : usersChange < 0 ? "📉 کاهش" : "➡️ ثابت"
      }\n\n` +
      `📅 <b>دوره:</b> ${startOfMonth.toLocaleDateString(
        "fa-IR"
      )} تا ${endOfMonth.toLocaleDateString("fa-IR")}\n` +
      `🕐 <b>آخرین بروزرسانی:</b> ${now.toLocaleString("fa-IR")}`;

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
      text: "✅ گزارش ماهانه نمایش داده شد",
    });
  } catch (error) {
    console.error("❌ Error in monthly report:", error.message);

    await bot.editMessageText(
      `❌ خطا در نمایش گزارش ماهانه:\n\n<code>${error.message}</code>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 تلاش مجدد", callback_data: "admin_monthly_report" },
              { text: "🏠 بازگشت", callback_data: "admin_financial_report" },
            ],
          ],
        },
      }
    );

    await bot.answerCallbackQuery(query.id, {
      text: "❌ خطا در نمایش گزارش ماهانه",
      show_alert: true,
    });
  }
};

export default monthlyReport;
