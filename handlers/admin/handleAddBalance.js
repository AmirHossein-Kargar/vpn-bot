import { setSession } from "../../config/sessionStore.js";
import User from "../../models/User.js";

const handleAddBalance = async (bot, msg, session) => {
  const chatId = msg.chat?.id || msg.chat_id || msg.message?.chat?.id;
  const messageId =
    session?.messageId || msg.message_id || msg.message?.message_id;
  const text = (msg.text || "").trim();

  if (!session?.step || session.step === "idle") {
    await bot.editMessageText("🆔 لطفاً آیدی عددی کاربر را ارسال کنید:", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔄 بازگشت به پنل مدیریت",
              callback_data: "admin_back_to_main",
            },
          ],
        ],
      },
    });
    await setSession(chatId, { ...session, step: "waiting_for_user_id" });
    return;
  } else if (session.step === "waiting_for_user_id") {
    if (messageId) {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        if (
          !error.message.includes("message to delete not found") &&
          !error.message.includes("message to edit not found")
        ) {
          console.error("Error deleting message:", error.message);
        }
      }
    }

    if (!/^\d+$/.test(text)) {
      await bot.sendMessage(
        chatId,
        "❌ آیدی عددی نامعتبر است، لطفاً دوباره ارسال کنید:",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 برگشت",
                  callback_data: "admin_panel",
                },
              ],
            ],
          },
        }
      );
      return;
    }

    const user = await User.findOne({ telegramId: text });

    if (!user) {
      await bot.editMessageText(
        "❌ کاربر با این آیدی یافت نشد، لطفاً دوباره ارسال کنید:",
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 برگشت", callback_data: "admin_panel" }],
            ],
          },
        }
      );
      return;
    }

    await setSession(chatId, {
      ...session,
      step: "waiting_for_amount",
      selectedUser: user,
    });

    await bot.editMessageText(
      `✅ کاربر پیدا شد:\n📱 شماره: ${
        user.phoneNumber
      }\n💰 موجودی فعلی: ${user.balance.toLocaleString()} تومان\n\nلطفاً مبلغ افزایش را ارسال کنید:`,
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 بازگشت به پنل مدیریت",
                callback_data: "admin_back_to_main",
              },
            ],
          ],
        },
      }
    );
    return;
  } else if (session.step === "waiting_for_amount") {
    if (messageId) {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        if (
          !error.message.includes("message to delete not found") &&
          !error.message.includes("message to edit not found")
        ) {
          console.error("Error deleting message:", error.message);
        }
      }
    }

    const amount = parseInt(text.replace(/,/g, ""), 10);

    if (isNaN(amount) || amount <= 0) {
      await bot.editMessageText(
        "❌ مبلغ نامعتبر است، لطفاً مبلغ صحیح را ارسال کنید:",
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 برگشت", callback_data: "admin_panel" }],
            ],
          },
        }
      );
      return;
    }

    const user = session.selectedUser;
    if (!user) {
      await bot.editMessageText("❌ کاربر یافت نشد. عملیات لغو شد.", {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 برگشت", callback_data: "admin_panel" }],
          ],
        },
      });
      return;
    }

    user.balance += amount;
    await user.save();

    //  * clear session
    await setSession(chatId, { step: "idle" });

    await bot.editMessageText(
      `✅ موجودی کاربر با موفقیت افزایش یافت.\n\n📱 شماره: ${
        user.phoneNumber
      }\n💰 موجودی جدید: ${user.balance.toLocaleString()} تومان`,
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 بازگشت به پنل مدیریت",
                callback_data: "admin_back_to_main",
              },
            ],
          ],
        },
      }
    );
    return;
  }
};

export default handleAddBalance;
