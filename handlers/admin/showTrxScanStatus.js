import trxScanner from "../../services/trxWalletScanner.js";

const showTrxScanStatus = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    const lines = [];
    lines.push("🔍 <b>وضعیت اسکنر TRX:</b>");
    lines.push("");

    // بخش وضعیت کلی
    lines.push("📊 <b>وضعیت کلی:</b>");
    lines.push(
      `• وضعیت اسکن: ${trxScanner.isScanning ? "⏳ در حال اسکن" : "✅ آماده"}`
    );
    lines.push(
      `• اسکن خودکار: ${trxScanner.scanInterval ? "🟢 فعال" : "🔴 غیرفعال"}`
    );
    lines.push(`• حالت تست: ${trxScanner.testMode ? "🧪 فعال" : "🚀 غیرفعال"}`);
    lines.push(`• آخرین به‌روزرسانی: ${new Date().toLocaleString("fa-IR")}`);
    lines.push("");

    // بخش تنظیمات
    lines.push("⚙️ <b>تنظیمات:</b>");
    lines.push(`• آدرس ولت: <code>${trxScanner.walletAddress}</code>`);
    lines.push(`• فاصله اسکن خودکار: هر 5 دقیقه`);
    lines.push(`• محدودیت تراکنش: 20 تراکنش آخر`);
    lines.push("");

    // بخش آمار عملکرد
    lines.push("📈 <b>آمار عملکرد:</b>");
    lines.push(
      `• اسکن‌های انجام شده: <code>${trxScanner.scanCount || 0}</code>`
    );
    lines.push(
      `• آخرین اسکن: ${
        trxScanner.lastScanTime
          ? new Date(trxScanner.lastScanTime).toLocaleString("fa-IR")
          : "نامشخص"
      }`
    );
    lines.push(
      `• زمان شروع: ${
        trxScanner.startTime
          ? new Date(trxScanner.startTime).toLocaleString("fa-IR")
          : "نامشخص"
      }`
    );
    lines.push("");

    // بخش وضعیت اتصال
    lines.push("🔗 <b>وضعیت اتصال:</b>");
    lines.push(
      `• TronScan API: ${trxScanner.tronScanConnected ? "🟢 متصل" : "🔴 قطع"}`
    );
    lines.push(
      `• دیتابیس: ${trxScanner.databaseConnected ? "🟢 متصل" : "🔴 قطع"}`
    );
    lines.push(
      `• Bot Instance: ${
        trxScanner.botInstance ? "🟢 تنظیم شده" : "🔴 تنظیم نشده"
      }`
    );
    lines.push("");

    // بخش کنترل‌ها
    lines.push("🎮 <b>کنترل‌ها:</b>");
    lines.push(`• اسکن دستی: در دسترس`);
    lines.push(`• شروع/توقف خودکار: در دسترس`);
    lines.push(`• تغییر حالت تست: در دسترس`);
    lines.push(`• تنظیم فاصله اسکن: در دسترس`);

    const resultText = lines.join("\n");

    // ارسال نتایج
    await bot.editMessageText(resultText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔄 اسکن دستی", callback_data: "admin_scan_trx_wallet" },
            { text: "🟢 شروع خودکار", callback_data: "admin_start_trx_auto" },
          ],
          [
            { text: "⏹️ توقف خودکار", callback_data: "admin_stop_trx_auto" },
            {
              text: "🧪 تغییر حالت تست",
              callback_data: "admin_toggle_trx_test",
            },
          ],
          [
            { text: "💰 موجودی", callback_data: "admin_trx_balance" },
            { text: "📊 آمار کامل", callback_data: "admin_trx_stats" },
          ],
          [{ text: "🏠 بازگشت", callback_data: "admin_back_to_panel" }],
        ],
      },
    });

    // پاسخ به callback query
    await bot.answerCallbackQuery(query.id, {
      text: "✅ وضعیت اسکنر TRX نمایش داده شد",
    });
  } catch (error) {
    console.error("❌ Error showing TRX scan status:", error.message);

    // ارسال پیام خطا
    await bot.editMessageText(
      `❌ خطا در نمایش وضعیت اسکنر TRX:\n\n<code>${error.message}</code>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 تلاش مجدد",
                callback_data: "admin_trx_scan_status",
              },
              { text: "🏠 بازگشت", callback_data: "admin_back_to_panel" },
            ],
          ],
        },
      }
    );

    // پاسخ به callback query
    await bot.answerCallbackQuery(query.id, {
      text: "❌ خطا در نمایش وضعیت اسکنر TRX",
      show_alert: true,
    });
  }
};

export default showTrxScanStatus;
