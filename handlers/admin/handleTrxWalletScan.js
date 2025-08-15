import trxScanner from "../../services/trxWalletScanner.js";

const handleTrxWalletScan = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  try {
    // ارسال پیام در حال اسکن
    await bot.editMessageText(
      "🔍 در حال اسکن ولت TRX...\n\n⏳ لطفاً صبر کنید...",
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 اسکن مجدد",
                callback_data: "admin_scan_trx_wallet",
              },
            ],
          ],
        },
      }
    );

    // اجرای اسکن دستی و دریافت خلاصه
    const summary = await trxScanner.manualScan();

    const lines = [];
    if (summary?.error) {
      lines.push(`❌ خطا: <code>${summary.error}</code>`);
    } else {
      lines.push("✅ اسکن ولت TRX با موفقیت انجام شد!");
      lines.push("");
      lines.push("📊 نتایج اسکن:");
      lines.push(`• کل تراکنش‌ ها: <code>${summary.totalTransactions}</code>`);
      lines.push(
        `• تراکنش‌ های پردازش‌ شده: <code>${summary.processedTransactions}</code>`
      );
      lines.push(`• فاکتورهای مطابق: <code>${summary.matchedInvoices}</code>`);
      lines.push(
        `• تایید شده: <code>${summary.confirmedInvoices}</code> | رد شده: <code>${summary.rejectedInvoices}</code> | در انتظار: <code>${summary.pendingMatches}</code>`
      );

      if (
        Array.isArray(summary.matchedInvoiceDetails) &&
        summary.matchedInvoiceDetails.length > 0
      ) {
        const preview = summary.matchedInvoiceDetails
          .slice(0, 10)
          .map(
            (d, idx) =>
              `${idx + 1}. <code>${d.invoiceId}</code> — <code>${
                d.cryptoAmount?.toFixed?.(6) ?? d.cryptoAmount
              }</code> TRX (${(d.amount ?? 0).toLocaleString()} تومان)`
          )
          .join("\n");
        lines.push("");
        lines.push("🧾 فاکتورهای مطابق:");
        lines.push(preview);
        if (summary.matchedInvoiceDetails.length > 10) {
          lines.push(
            `… و <code>${
              summary.matchedInvoiceDetails.length - 10
            }</code> مورد دیگر`
          );
        }
      }
    }

    const resultText = lines.join("\n");

    // ارسال نتایج به‌صورت ادیت پیام
    await bot.editMessageText(resultText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔄 اسکن مجدد", callback_data: "admin_scan_trx_wallet" },
            { text: "🏠 بازگشت", callback_data: "admin_back_to_panel" },
          ],
        ],
      },
    });

    // پاسخ به callback query
    await bot.answerCallbackQuery(query.id, {
      text: "✅ اسکن ولت TRX انجام شد",
    });
  } catch (error) {
    console.error("❌ Error in TRX wallet scan:", error.message);

    // ارسال پیام خطا
    await bot.editMessageText(
      `❌ خطا در اسکن ولت TRX:\n\n<code>${error.message}</code>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 تلاش مجدد",
                callback_data: "admin_scan_trx_wallet",
              },
              { text: "🏠 بازگشت", callback_data: "admin_back_to_panel" },
            ],
          ],
        },
      }
    );

    // پاسخ به callback query
    await bot.answerCallbackQuery(query.id, {
      text: "❌ خطا در اسکن ولت TRX",
      show_alert: true,
    });
  }
};

export default handleTrxWalletScan;
