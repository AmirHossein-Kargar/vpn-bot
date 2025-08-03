import { getSession, setSession } from "../config/sessionStore.js";
import User from "../models/User.js";
import handleTonAmount from "../paymentHandlers/handleTonAmount.js";
import payBank from "../paymentHandlers/payBank.js";
import handleAddBalance from "./admin/handleAddBalance.js";
import supportMessageHandler from "./supportMessageHandler.js";

// Top-level function for sending config to user
async function handleSendConfig(bot, msg, session) {
  const messageId = session.messageId;
  const chatId = msg.chat.id;
  let configText = msg.text;
  const targetUserId = session.targetUserId;

  if (!targetUserId) {
    await bot.sendMessage(chatId, "❌ خطا: کاربر مورد نظر یافت نشد.");
    return;
  }

  try {
    // Send config to the target user with selective monospace formatting
    // Format subscription links and vless links as monospace
    let formattedConfigText = configText;

    // Format subscription links (https://iranisystem.com/bot/sub/?hash=...)
    formattedConfigText = formattedConfigText.replace(
      /(https:\/\/iranisystem\.com\/bot\/sub\/\?hash=[^\s]+)/g,
      "`$1`"
    );

    // Format vless links (vless://...)
    formattedConfigText = formattedConfigText.replace(
      /(vless:\/\/[^\s]+)/g,
      "`$1`"
    );

    await bot.sendMessage(targetUserId, formattedConfigText, {
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

// Top-level function for handling message
async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);

  // Forward support messages if in support mode (only for text messages)
  if (session?.support && msg.text) {
    await supportMessageHandler(bot, msg);
    return;
  }

  const userText = msg.text;

  if (session?.step === "waiting_for_ton_amount") {
    return handleTonAmount(bot, msg);
  }

  if (session?.step === "waiting_for_bank_amount" && msg.text) {
    await payBank(bot, msg, session);
    return;
  }

  if (
    session?.step === "waiting_for_user_id" ||
    session?.step === "waiting_for_amount"
  ) {
    await handleAddBalance(bot, msg, session);
  }

  if (session?.step === "waiting_for_config_details") {
    // Only proceed if this message is a reply to the prompt message
    if (
      msg.reply_to_message &&
      session.messageId &&
      msg.reply_to_message.message_id === session.messageId
    ) {
      await handleSendConfig(bot, msg, session);
    }
    // else: ignore message, do not send config
  }

  // If msg.session.step is "waiting_for_vpn_id", handle registering VPN ID
  const currentSession = msg.session || session;
  if (currentSession?.step === "waiting_for_vpn_id") {
    const chatId = msg.chat.id;
    const vpnId = msg.text?.trim();
    const telegramId = currentSession.targetTelegramId;
    const messageId =
      currentSession.messageId ||
      (msg.reply_to_message && msg.reply_to_message.message_id);

    // Only respond if this message is a reply to the prompt message
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
            const exists = user.services.some((s) => s.username === vpnId);
            if (exists) {
              editText = "❌ این آیدی سرویس قبلاً ثبت شده است.";
              await bot.editMessageText(editText, editOptions);
            } else {
              // Add the username to the user's services array and increment totalServices
              user.services.push({ username: vpnId });
              user.totalServices += 1;
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
        console.error("❌ خطا در حذف پیام ادمین:", error);
      }
    }
  }
}

export default handleMessage;
