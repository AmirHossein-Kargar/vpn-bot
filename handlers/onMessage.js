import { getSession, setSession } from "../config/sessionStore.js";
import User from "../models/User.js";
import handleTonAmount from "../paymentHandlers/handleTonAmount.js";
import payBank from "../paymentHandlers/payBank.js";
import handleTrxAmount from "../paymentHandlers/handleTrxAmount.js";
import supportMessageHandler from "./supportMessageHandler.js";
import {
  handleApiGigInput,
  handleApiDaysInput,
} from "./admin/apiServicePurchase.js";

// Function to send config to user
async function handleSendConfig(bot, msg, session) {
  const messageId = session.messageId;
  const chatId = msg.chat.id;
  const configText = msg.text;
  const targetUserId = session.targetUserId;

  if (!targetUserId) {
    await bot.sendMessage(chatId, "❌ خطا: کاربر مورد نظر یافت نشد.");
    return;
  }

  try {
    const targetChatId = Number(targetUserId);

    // Format subscription and vless links as monospace (Markdown)
    let formattedConfigText = configText
      .replace(/(https:\/\/iranisystem\.com\/bot\/sub\/\?hash=[^\s]+)/g, "`$1`")
      .replace(/(vless:\/\/[^\s]+)/g, "`$1`");

    await bot.sendMessage(targetChatId, formattedConfigText, {
      parse_mode: "Markdown",
    });

    // Confirm to admin
    await bot.editMessageText("✅ کانفیگ با موفقیت به کاربر ارسال شد.", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔗 ثبت آیدی سرویس",
              callback_data: `register_vpn_id:${targetUserId}`,
            },
          ],
        ],
      },
    });

    // Clear session
    await setSession(chatId, { step: null });
  } catch (error) {
    console.error("Error sending config to user:", error);
    await bot.sendMessage(chatId, "❌ خطا در ارسال کانفیگ به کاربر.");
  }
}

async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);

  // Forward support messages if in support mode (only for text messages)
  if (session?.support && msg.text) {
    await supportMessageHandler(bot, msg);
    return;
  }

  if (session?.step === "waiting_for_ton_amount") {
    return handleTonAmount(bot, msg);
  }

  if (session?.step === "waiting_for_bank_amount" && msg.text) {
    await payBank(bot, msg, session);
    return;
  }

  if (session?.step === "waiting_for_trx_amount" && msg.text) {
    await handleTrxAmount(bot, msg, session);
    return;
  }

  // Handle API service purchase - waiting for gig input
  if (session?.step === "waiting_for_api_gig" && msg.text) {
    await handleApiGigInput(bot, msg, session);
    return;
  }

  // Handle API service purchase - waiting for days input
  if (session?.step === "waiting_for_api_days" && msg.text) {
    await handleApiDaysInput(bot, msg, session);
    return;
  }

  // Handle config sending (waiting_for_config_details)
  if (session?.step === "waiting_for_config_details") {
    if (
      msg.reply_to_message &&
      session.messageId &&
      msg.reply_to_message.message_id === session.messageId
    ) {
      await handleSendConfig(bot, msg, session);
    }
    // else: ignore message, do not send config
    return;
  }

  // Handle admin waiting for user ID to send message
  if (session?.step === "admin_waiting_for_user_id") {
    const userId = msg.text?.trim();
    const messageId = session.messageId;

    if (!userId || isNaN(userId)) {
      await bot.sendMessage(chatId, "❌ لطفاً یک آیدی عددی معتبر وارد کنید.");
      return;
    }

    try {
      // بررسی وجود کاربر
      const user = await User.findOne({ telegramId: userId });
      if (!user) {
        await bot.sendMessage(chatId, "❌ کاربری با این آیدی یافت نشد.");
        return;
      }

      // پاک کردن پیام حاوی آیدی کاربر
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (error) {
        console.log("خطا در حذف پیام آیدی:", error.message);
      }

      // ادیت پیام قبلی به جای ارسال پیام جدید
      await bot.editMessageText(
        `✅ کاربر یافت شد!\n\n👤 <b>نام:</b> ${
          user.firstName || "نامشخص"
        }\n📱 <b>آیدی:</b> <code>${userId}</code>\n\n📝 حالا پیام مورد نظر خود را وارد کنید:`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏠 بازگشت", callback_data: "admin_back_to_panel" }],
            ],
          },
        }
      );

      // ذخیره آیدی کاربر و messageId قبلی در session
      await setSession(chatId, {
        step: "admin_waiting_for_message",
        targetUserId: userId,
        messageId: messageId,
      });
    } catch (error) {
      console.error("Error finding user:", error);
      await bot.sendMessage(chatId, "❌ خطا در جستجوی کاربر.");
    }
    return;
  }

  // Handle admin waiting for message to send to user
  if (session?.step === "admin_waiting_for_message") {
    const messageText = msg.text;
    const targetUserId = session.targetUserId;
    const messageId = session.messageId;

    if (!messageText || !targetUserId) {
      await bot.sendMessage(chatId, "❌ خطا: پیام یا کاربر یافت نشد.");
      return;
    }

    try {
      const targetChatId = Number(targetUserId);

      // پاک کردن پیام حاوی متن پیام
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (error) {
        console.log("خطا در حذف پیام متن:", error.message);
      }

      // ارسال پیام زیبا به کاربر
      const userMessage = `🔔 <b>پیام از پشتیبانی</b>\n\n${messageText}`;

      await bot.sendMessage(targetChatId, userMessage, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📞 تماس با پشتیبانی",
                url: "https://t.me/Swift_servicebot",
              },
            ],
          ],
        },
      });

      // تایید به ادمین
      await bot.editMessageText(
        `✅ پیام با موفقیت به کاربر ارسال شد!\n\n👤 <b>کاربر:</b> <code>${targetUserId}</code>\n📝 <b>پیام:</b> ${messageText.substring(
          0,
          100
        )}${
          messageText.length > 100 ? "..." : ""
        }\n\n🕐 <b>زمان ارسال:</b> ${new Date().toLocaleString("fa-IR")}`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏠 بازگشت", callback_data: "admin_back_to_panel" }],
            ],
          },
        }
      );

      // پاک کردن session
      await setSession(chatId, { step: null });
    } catch (error) {
      console.error("Error sending message to user:", error);
      await bot.sendMessage(chatId, "❌ خطا در ارسال پیام به کاربر.");
    }
    return;
  }

  // Handle registering VPN ID
  const currentSession = msg.session || session;
  if (currentSession?.step === "waiting_for_vpn_id") {
    const vpnId = msg.text?.trim();
    const telegramId = currentSession.targetTelegramId;
    const messageId =
      currentSession.messageId ||
      (msg.reply_to_message && msg.reply_to_message.message_id);

    if (
      msg.reply_to_message &&
      messageId &&
      msg.reply_to_message.message_id === messageId
    ) {
      let editText = "";
      const editOptions = {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
      };

      if (
        !vpnId ||
        typeof vpnId !== "string" ||
        vpnId.length < 3 ||
        vpnId.length > 50
      ) {
        editText = "❌ آیدی سرویس معتبر نیست.";
        await bot.editMessageText(editText, editOptions);
        await setSession(chatId, { step: null });
      } else {
        try {
          const user = await User.findOne({ telegramId: telegramId });
          if (!user) {
            editText = "❌ کاربر مورد نظر یافت نشد.";
            await bot.editMessageText(editText, editOptions);
          } else {
            const exists = Array.isArray(user.services)
              ? user.services.some((s) => s.username === vpnId)
              : false;
            if (exists) {
              editText = "❌ این آیدی سرویس قبلاً ثبت شده است.";
              await bot.editMessageText(editText, editOptions);
            } else {
              // Add the username to the user's services array and increment totalServices
              if (!Array.isArray(user.services)) user.services = [];
              user.services.push({ username: vpnId });
              user.totalServices = (user.totalServices || 0) + 1;
              await user.save();

              await bot.editMessageText(
                "✅ آیدی سرویس با موفقیت ثبت شد.",
                editOptions
              );
            }
          }
        } catch (error) {
          console.error("❌ خطا در ذخیره سرویس دستی:", error);
          editText = "❌ خطا در ذخیره سرویس در دیتابیس.";
          await bot.editMessageText(editText, editOptions);
        }
        await setSession(chatId, { step: null });
      }
      try {
        if (msg.message_id) {
          await bot.deleteMessage(chatId, msg.message_id);
        }
      } catch (error) {
        // Ignore deletion error
      }
    }
  }
}

export default handleMessage;
