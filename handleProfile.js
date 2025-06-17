// spell-checker: disable
const moment = require("moment-jalaali");
const User = require("./models/User");

moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

module.exports = async function handleProfile(bot, chatId, userId) {
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

    const formattedDate = moment(user.createdAt).format("jYYYY/jM/jD");

    const message = `👤 شناسه کاربری: <code>${user.telegramId}</code>
    
💰 موجودی: <code>${user.balance.toLocaleString()}</code> تومان
🟢 پرداخت های موفق: <code>${user.successfulPayments} عدد</code>
📦 کل سرویس ها: <code>${user.totalServices} عدد</code>
📞 شماره تلفن: <code>${phone}</code>
🕒 تاریخ عضویت: ${formattedDate}`;

    bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (err) {
    bot.sendMessage(chatId, "❌ خطایی رخ داده است. لطفاً دوباره تلاش کنید.");
  }
};
