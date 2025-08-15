import CryptoInvoice from "../../models/CryptoInvoice.js";
import invoice from "../../models/invoice.js";
import User from "../../models/User.js";
import { plans30, plans60, plans90 } from "../../services/plans.js";

const profitChart = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    // دریافت آمار کامل
    const paidCrypto = await CryptoInvoice.find({ status: "paid" });
    const confirmedBank = await invoice.find({
      status: { $in: ["paid", "confirmed"] },
    });
    const allUsers = await User.find({});

    // محاسبات درآمد
    const cryptoSum = paidCrypto.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const bankSum = confirmedBank.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const totalTopups = cryptoSum + bankSum;

    // موجودی فعلی کاربران
    const totalBalances = allUsers.reduce(
      (sum, u) => sum + (u.balance || 0),
      0
    );
    const recognizedRevenue = Math.max(0, totalTopups - totalBalances);

    // تخمین سرویس‌های فروخته شده
    const allPlans = [...plans30, ...plans60, ...plans90]
      .map((p) => ({ price: p.price, gig: p.gig, days: p.days }))
      .sort((a, b) => b.price - a.price);

    let remaining = recognizedRevenue;
    let estGigSold = 0;
    let estDaysSold = 0;

    for (const plan of allPlans) {
      if (plan.price > 0 && remaining >= plan.price) {
        const cnt = Math.floor(remaining / plan.price);
        if (cnt > 0) {
          estGigSold += cnt * (plan.gig || 0);
          estDaysSold += cnt * (plan.days || 0);
          remaining -= cnt * plan.price;
        }
      }
    }

    // محاسبه هزینه‌ها
    const costPerDay = Number(process.env.COST_PER_DAY || 200);
    const costPerGb = Number(process.env.COST_PER_GB || 300);
    const totalCost = estDaysSold * costPerDay + estGigSold * costPerGb;
    const profit = recognizedRevenue - totalCost;

    // محاسبه درصدها
    const profitMargin =
      recognizedRevenue > 0
        ? ((profit / recognizedRevenue) * 100).toFixed(1)
        : 0;
    const costPercentage =
      recognizedRevenue > 0
        ? ((totalCost / recognizedRevenue) * 100).toFixed(1)
        : 0;

    // نمودار سود (با emoji)
    const createBarChart = (percentage, maxBars = 20) => {
      const bars = Math.round((percentage / 100) * maxBars);
      return "█".repeat(bars) + "░".repeat(maxBars - bars);
    };

    const report =
      `📈 <b>نمودار سود و زیان</b>\n\n` +
      `💰 <b>درآمد کل:</b> <code>${totalTopups.toLocaleString()}</code> تومان\n` +
      `👛 <b>موجودی کاربران:</b> <code>${totalBalances.toLocaleString()}</code> تومان\n` +
      `🎯 <b>درآمد واقعی:</b> <code>${recognizedRevenue.toLocaleString()}</code> تومان\n\n` +
      `💸 <b>هزینه‌ها:</b>\n` +
      `• هزینه کل: <code>${totalCost.toLocaleString()}</code> تومان\n` +
      `• هزینه هر روز: <code>${costPerDay.toLocaleString()}</code> تومان\n` +
      `• هزینه هر گیگ: <code>${costPerGb.toLocaleString()}</code> تومان\n\n` +
      `📊 <b>نمودار سود:</b>\n` +
      `سود: ${createBarChart(profitMargin)} ${profitMargin}%\n` +
      `هزینه: ${createBarChart(costPercentage)} ${costPercentage}%\n\n` +
      `🎉 <b>سود خالص:</b> <code>${profit.toLocaleString()}</code> تومان\n` +
      `📈 <b>حاشیه سود:</b> <code>${profitMargin}%</code>\n\n` +
      `🛒 <b>تخمین فروش:</b>\n` +
      `• گیگ فروخته شده: <code>${estGigSold.toLocaleString()}</code> GB\n` +
      `• روز فروخته شده: <code>${estDaysSold.toLocaleString()}</code> روز\n\n` +
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
      text: "✅ نمودار سود نمایش داده شد",
    });
  } catch (error) {
    console.error("❌ Error in profit chart:", error.message);

    await bot.editMessageText(
      `❌ خطا در نمایش نمودار سود:\n\n<code>${error.message}</code>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 تلاش مجدد", callback_data: "admin_profit_chart" },
              { text: "🏠 بازگشت", callback_data: "admin_financial_report" },
            ],
          ],
        },
      }
    );

    await bot.answerCallbackQuery(query.id, {
      text: "❌ خطا در نمایش نمودار سود",
      show_alert: true,
    });
  }
};

export default profitChart;
