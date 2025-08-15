import { TRXPrice } from "../../api/TRXPrice.js";
import { USDPrice } from "../../api/USDPrice.js";
import trxScanner from "../../services/trxWalletScanner.js";

const showTrxBalance = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    // ارسال پیام در حال بارگذاری
    await bot.editMessageText(
      "💰 در حال دریافت موجودی ولت TRX...\n\n⏳ لطفاً صبر کنید...",
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 بارگذاری مجدد",
                callback_data: "admin_trx_balance",
              },
            ],
          ],
        },
      }
    );

    // دریافت موجودی ولت
    const walletBalance = await trxScanner.fetchWalletBalance();

    // دریافت قیمت‌ها
    const trxPrice = await TRXPrice();
    const usdPrice = await USDPrice();

    // محاسبات
    const walletBalanceUSD = trxPrice ? walletBalance * trxPrice : null;
    const walletBalanceToman =
      usdPrice && walletBalanceUSD ? walletBalanceUSD * usdPrice : null;

    const lines = [];
    lines.push("💰 <b>موجودی ولت TRX:</b>");
    lines.push("");

    // بخش موجودی TRX
    lines.push("🪙 <b>موجودی TRX:</b>");
    lines.push(`• موجودی فعلی: <code>${walletBalance.toFixed(6)}</code> TRX`);
    lines.push("");

    // بخش ارزش دلاری
    if (walletBalanceUSD) {
      lines.push("💵 <b>ارزش دلاری:</b>");
      lines.push(`• ارزش USD: <code>$${walletBalanceUSD.toFixed(2)}</code>`);
      lines.push("");
    }

    // بخش ارزش تومانی
    if (walletBalanceToman) {
      lines.push("🇮🇷 <b>ارزش تومانی:</b>");
      lines.push(
        `• ارزش تومان: <code>${walletBalanceToman.toLocaleString()}</code> تومان`
      );
      lines.push("");
    }

    // بخش قیمت‌ها
    lines.push("📊 <b>قیمت‌های فعلی:</b>");
    if (trxPrice) {
      lines.push(`• قیمت TRX: <code>$${trxPrice.toFixed(6)}</code>`);
    } else {
      lines.push(`• قیمت TRX: <code>نامشخص</code>`);
    }

    if (usdPrice) {
      lines.push(`• نرخ USD: <code>${usdPrice.toLocaleString()}</code> تومان`);
    } else {
      lines.push(`• نرخ USD: <code>نامشخص</code>`);
    }
    lines.push("");

    // بخش اطلاعات ولت
    lines.push("🔗 <b>اطلاعات ولت:</b>");
    lines.push(`• آدرس: <code>${trxScanner.walletAddress}</code>`);
    lines.push(`• آخرین به‌روزرسانی: ${new Date().toLocaleString("fa-IR")}`);
    lines.push(
      `• وضعیت: ${trxScanner.isScanning ? "⏳ در حال اسکن" : "✅ آماده"}`
    );

    const resultText = lines.join("\n");

    // ارسال نتایج
    await bot.editMessageText(resultText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔄 بارگذاری مجدد", callback_data: "admin_trx_balance" },
            { text: "🔍 اسکن کامل", callback_data: "admin_scan_trx_wallet" },
          ],
          [
            { text: "📊 آمار کامل", callback_data: "admin_trx_stats" },
            { text: "🏠 بازگشت", callback_data: "admin_back_to_panel" },
          ],
        ],
      },
    });

    // پاسخ به callback query
    await bot.answerCallbackQuery(query.id, {
      text: "✅ موجودی ولت TRX دریافت شد",
    });
  } catch (error) {
    console.error("❌ Error showing TRX balance:", error.message);

    // ارسال پیام خطا
    await bot.editMessageText(
      `❌ خطا در دریافت موجودی ولت TRX:\n\n<code>${error.message}</code>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 تلاش مجدد",
                callback_data: "admin_trx_balance",
              },
              { text: "🏠 بازگشت", callback_data: "admin_back_to_panel" },
            ],
          ],
        },
      }
    );

    // پاسخ به callback query
    await bot.answerCallbackQuery(query.id, {
      text: "❌ خطا در دریافت موجودی ولت TRX",
      show_alert: true,
    });
  }
};

export default showTrxBalance;
