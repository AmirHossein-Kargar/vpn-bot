// spell-checker: disable
import moment from "moment-jalaali";
import User from "../../models/User.js";
import formatDate from "../../utils/formatDate.js";

moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

const handleProfile = async (bot, chatId, userId) => {
  try {
    const user = await User.findOne({ telegramId: userId });

    if (!user || !user.phoneNumber) {
      const requestContactKeyboard = {
        reply_markup: {
          keyboard: [
            [
              {
                text: "📞 ارسال شماره من",
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      };

      bot.sendMessage(
        chatId,
        "📞 لطفاً شماره تلفن خود را ارسال کنید:",
        requestContactKeyboard
      );
      return;
    }

    const phone = user.phoneNumber.startsWith("+98")
      ? user.phoneNumber.replace("+98", "0")
      : user.phoneNumber;

    const formattedDate = formatDate(user.createdAt);

    const message = `👤 شناسه کاربری: <code>${user.telegramId}</code>
    
💰 موجودی: <code>${user.balance.toLocaleString()} تومان</code>
🟢 پرداخت های موفق: <code>${user.successfulPayments} عدد</code>
📦 کل سرویس ها: <code>${user.totalServices} عدد</code>
📞 شماره تلفن: <code>${phone}</code>
🕒 تاریخ عضویت: <code>${formattedDate}</code>`;

    // Add inline button "اعمال کد تخفیف" with emoji
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎟️ اعمال کد تخفیف",
              callback_data: "apply_discount_code",
            },
          ],
        ],
      },
      parse_mode: "HTML",
    };

    bot.sendMessage(chatId, message, { parse_mode: "HTML", ...inlineKeyboard });
  } catch (err) {
    bot.sendMessage(chatId, "❌ خطایی رخ داده است. لطفاً دوباره تلاش کنید.");
  }
};

export default handleProfile;
