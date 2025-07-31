import { getSession, setSession } from "../config/sessionStore.js";
import User from "../models/User.js";
import handleTonAmount from "../paymentHandlers/handleTonAmount.js";
import payBank from "../paymentHandlers/payBank.js";
import handleAddBalance from "./admin/handleAddBalance.js";
import supportMessageHandler from "./supportMessageHandler.js";

const handleMessage = async (bot, msg) => {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);

  // Forward support messages if in support mode
  if (session?.support) {
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

    if (
      !vpnId ||
      typeof vpnId !== "string" ||
      vpnId.length < 3 ||
      vpnId.length > 50
    ) {
      await bot.sendMessage(chatId, "❌ آیدی سرویس معتبر نیست.");
      await setSession(chatId, { step: null });
      // Do not return, just stop further processing
    } else {
      try {
        const user = await User.findOne({ telegramId });
        if (!user) {
          await bot.sendMessage(chatId, "❌ کاربر مورد نظر یافت نشد.");
        } else {
          if (!user.vpnId.includes(vpnId)) {
            user.vpnId.push(vpnId);
            await user.save();

            await bot.sendMessage(
              chatId,
              `✅ آیدی سرویس با موفقیت برای کاربر ثبت شد.\n\nآیدی عددی کاربر: <code>${telegramId}</code>`,
              { parse_mode: "HTML" }
            );
          } else {
            await bot.sendMessage(
              chatId,
              "❌ این آیدی سرویس قبلاً ثبت شده است."
            );
          }
        }
      } catch (error) {
        console.error("❌ خطا در ذخیره آیدی سرویس:", error);
        await bot.sendMessage(chatId, "❌ خطا در ذخیره آیدی سرویس در دیتابیس.");
      }
      await setSession(chatId, { step: null });
      // Do not return, just stop further processing
    }
  }
};

// Handle sending config to user
const handleSendConfig = async (bot, msg, session) => {
  const messageId = session.messageId;
  const chatId = msg.chat.id;
  let configText = msg.text;
  const targetUserId = session.targetUserId;

  if (!targetUserId) {
    await bot.sendMessage(chatId, "❌ خطا: کاربر مورد نظر یافت نشد.");
    return;
  }

  try {
    // Send config to the target user
    await bot.sendMessage(targetUserId, configText);

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
};

export default handleMessage;
