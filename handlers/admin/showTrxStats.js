import CryptoInvoice from "../../models/CryptoInvoice.js";
import { TRXPrice } from "../../api/TRXPrice.js";
import { USDPrice } from "../../api/USDPrice.js";

const showTrxStats = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    // ارسال پیام در حال بارگذاری
    await bot.editMessageText(
      "📊 در حال دریافت آمار کامل TRX...\n\n⏳ لطفاً صبر کنید...",
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 بارگذاری مجدد",
                callback_data: "admin_trx_stats",
              },
            ],
          ],
        },
      }
    );

    // دریافت آمار کامل از دیتابیس
    const stats = await getDetailedStats();

    // دریافت قیمت‌ها
    const trxPrice = await TRXPrice();
    const usdPrice = await USDPrice();

    const lines = [];
    lines.push("📊 <b>آمار کامل TRX:</b>");
    lines.push("");

    // بخش آمار کلی
    lines.push("📈 <b>آمار کلی:</b>");
    lines.push(`• کل فاکتورهای TRX: <code>${stats.totalInvoices}</code>`);
    lines.push(`• پرداخت شده: <code>${stats.paidInvoices}</code>`);
    lines.push(`• در انتظار: <code>${stats.pendingInvoices}</code>`);
    lines.push(`• رد شده: <code>${stats.rejectedInvoices}</code>`);
    lines.push("");

    // بخش مبالغ
    lines.push("💰 <b>مبالغ:</b>");
    lines.push(
      `• کل مبلغ پرداخت شده: <code>${stats.totalPaidAmount.toLocaleString()}</code> تومان`
    );
    lines.push(
      `• کل مبلغ TRX پرداخت شده: <code>${stats.totalPaidTrx.toFixed(
        6
      )}</code> TRX`
    );

    if (trxPrice && usdPrice) {
      const totalPaidUSD = stats.totalPaidTrx * trxPrice;
      const totalPaidTomanCalculated = totalPaidUSD * usdPrice;
      lines.push(`• کل مبلغ USD: <code>$${totalPaidUSD.toFixed(2)}</code>`);
      lines.push(
        `• محاسبه تومان: <code>${totalPaidTomanCalculated.toLocaleString()}</code> تومان`
      );
    }
    lines.push("");

    // بخش آمار ماهانه
    if (stats.monthlyStats.length > 0) {
      lines.push("📅 <b>آمار ماهانه (3 ماه اخیر):</b>");
      stats.monthlyStats.forEach((month) => {
        lines.push(
          `• ${month.month}: <code>${
            month.count
          }</code> فاکتور - <code>${month.amount.toLocaleString()}</code> تومان`
        );
      });
      lines.push("");
    }

    // بخش فاکتورهای اخیر
    if (stats.recentInvoices.length > 0) {
      lines.push("🕒 <b>آخرین فاکتورهای پرداخت شده:</b>");
      stats.recentInvoices.slice(0, 5).forEach((invoice, idx) => {
        const date = new Date(invoice.confirmedAt).toLocaleDateString("fa-IR");
        lines.push(
          `${idx + 1}. <code>${
            invoice.invoiceId
          }</code> - <code>${invoice.cryptoAmount.toFixed(
            6
          )}</code> TRX - <code>${invoice.amount.toLocaleString()}</code> تومان - ${date}`
        );
      });
      lines.push("");
    }

    // بخش وضعیت سیستم
    lines.push("🔧 <b>وضعیت سیستم:</b>");
    lines.push(`• آخرین به‌روزرسانی: ${new Date().toLocaleString("fa-IR")}`);
    lines.push(`• تعداد کاربران فعال: <code>${stats.activeUsers}</code>`);
    lines.push(
      `• میانگین مبلغ فاکتور: <code>${stats.averageInvoiceAmount.toLocaleString()}</code> تومان`
    );
    lines.push(`• نرخ موفقیت: <code>${stats.successRate.toFixed(1)}%</code>`);

    const resultText = lines.join("\n");

    // ارسال نتایج
    await bot.editMessageText(resultText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔄 بارگذاری مجدد", callback_data: "admin_trx_stats" },
            { text: "🔍 اسکن کامل", callback_data: "admin_scan_trx_wallet" },
          ],
          [
            { text: "💰 موجودی", callback_data: "admin_trx_balance" },
            { text: "🕒 تراکنش‌های اخیر", callback_data: "admin_trx_recent" },
          ],
          [{ text: "🏠 بازگشت", callback_data: "admin_back_to_panel" }],
        ],
      },
    });

    // پاسخ به callback query
    await bot.answerCallbackQuery(query.id, {
      text: "✅ آمار کامل TRX دریافت شد",
    });
  } catch (error) {
    console.error("❌ Error showing TRX stats:", error.message);

    // ارسال پیام خطا
    await bot.editMessageText(
      `❌ خطا در دریافت آمار کامل TRX:\n\n<code>${error.message}</code>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 تلاش مجدد",
                callback_data: "admin_trx_stats",
              },
              { text: "🏠 بازگشت", callback_data: "admin_back_to_panel" },
            ],
          ],
        },
      }
    );

    // پاسخ به callback query
    await bot.answerCallbackQuery(query.id, {
      text: "❌ خطا در دریافت آمار کامل TRX",
      show_alert: true,
    });
  }
};

// تابع دریافت آمار تفصیلی
async function getDetailedStats() {
  try {
    // آمار کلی
    const totalInvoices = await CryptoInvoice.countDocuments({
      paymentType: "trx",
    });
    const paidInvoices = await CryptoInvoice.countDocuments({
      paymentType: "trx",
      status: "paid",
    });
    const pendingInvoices = await CryptoInvoice.countDocuments({
      paymentType: "trx",
      status: "unpaid",
    });
    const rejectedInvoices = await CryptoInvoice.countDocuments({
      paymentType: "trx",
      status: "rejected",
    });

    // محاسبه مبالغ
    const paidInvoicesData = await CryptoInvoice.find({
      paymentType: "trx",
      status: "paid",
    });
    const totalPaidAmount = paidInvoicesData.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const totalPaidTrx = paidInvoicesData.reduce(
      (sum, inv) => sum + (inv.cryptoAmount || 0),
      0
    );

    // آمار ماهانه (3 ماه اخیر)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const monthlyStats = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthInvoices = await CryptoInvoice.find({
        paymentType: "trx",
        status: "paid",
        confirmedAt: { $gte: monthStart, $lte: monthEnd },
      });

      const monthAmount = monthInvoices.reduce(
        (sum, inv) => sum + (inv.amount || 0),
        0
      );
      const monthName = monthStart.toLocaleDateString("fa-IR", {
        month: "long",
        year: "numeric",
      });

      monthlyStats.push({
        month: monthName,
        count: monthInvoices.length,
        amount: monthAmount,
      });
    }

    // فاکتورهای اخیر
    const recentInvoices = await CryptoInvoice.find({
      paymentType: "trx",
      status: "paid",
    })
      .sort({ confirmedAt: -1 })
      .limit(5);

    // آمار کاربران
    const User = (await import("../../models/User.js")).default;
    const activeUsers = await User.countDocuments({
      successfulPayments: { $gt: 0 },
    });

    // محاسبات آماری
    const averageInvoiceAmount =
      totalPaidInvoices > 0 ? totalPaidAmount / totalPaidInvoices : 0;
    const successRate =
      totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      rejectedInvoices,
      totalPaidAmount,
      totalPaidTrx,
      monthlyStats,
      recentInvoices,
      activeUsers,
      averageInvoiceAmount,
      successRate,
    };
  } catch (error) {
    console.error("❌ Error getting detailed stats:", error.message);
    return {
      totalInvoices: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
      rejectedInvoices: 0,
      totalPaidAmount: 0,
      totalPaidTrx: 0,
      monthlyStats: [],
      recentInvoices: [],
      activeUsers: 0,
      averageInvoiceAmount: 0,
      successRate: 0,
    };
  }
}

export default showTrxStats;
