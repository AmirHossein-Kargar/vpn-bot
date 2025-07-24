import { setSession } from "../../config/sessionStore.js";
import User from "../../models/User.js";

const handleAddBalance = async (bot, msg, session) => {
  const chatId = msg.chat?.id || msg.chat_id || msg.message?.chat?.id;
  const text = (msg.text || "").trim();

  if (!session?.step || session.step === "idle") {
    await bot.sendMessage(chatId, "🆔 لطفاً آیدی عددی کاربر را ارسال کنید:", {
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
    await setSession(chatId, { step: "waiting_for_user_id" });
    return;
  }

  if (session.step === "waiting_for_user_id") {
    if (!/^\d+$/.test(text)) {
      await bot.sendMessage(
        chatId,
        "❌ آیدی عددی نامعتبر است، لطفاً دوباره ارسال کنید:",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 برگشت", callback_data: "admin_panel" }],
            ],
          },
        }
      );
      return;
    }

    const user = await User.findOne({ telegramId: text });
    if (!user) {
      await bot.sendMessage(
        chatId,
        "❌ کاربر با این آیدی یافت نشد، لطفاً دوباره ارسال کنید:",
        {
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
      step: "waiting_for_amount",
      selectedUser: { telegramId: user.telegramId },
    });

    await bot.sendMessage(
      chatId,
      `✅ کاربر پیدا شد:\n📱 شماره: ${
        user.phoneNumber
      }\n💰 موجودی فعلی: ${user.balance.toLocaleString()} تومان\n\nلطفاً مبلغ افزایش را ارسال کنید:`,
      {
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

  if (session.step === "waiting_for_amount") {
    const amount = parseInt(text.replace(/,/g, ""), 10);
    if (isNaN(amount) || amount <= 0) {
      await bot.sendMessage(
        chatId,
        "❌ مبلغ نامعتبر است، لطفاً مبلغ صحیح را ارسال کنید:",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 برگشت", callback_data: "admin_panel" }],
            ],
          },
        }
      );
      return;
    }

    const user = await User.findOne({
      telegramId: session.selectedUser.telegramId,
    });
    if (!user) {
      await bot.sendMessage(chatId, "❌ کاربر یافت نشد. عملیات لغو شد.", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 برگشت", callback_data: "admin_panel" }],
          ],
        },
      });
      await setSession(chatId, { step: "idle" });
      return;
    }

    user.balance += amount;
    await user.save();
    await setSession(chatId, { step: "idle" });

    await bot.sendMessage(
      chatId,
      `✅ موجودی کاربر با موفقیت افزایش یافت.\n\n📱 شماره: ${
        user.phoneNumber
      }\n💰 موجودی جدید: ${user.balance.toLocaleString()} تومان`,
      {
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
