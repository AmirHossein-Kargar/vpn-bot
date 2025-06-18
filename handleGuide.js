// disable-spell
module.exports = function handleGuide(bot, chatId) {
  const guideMessage = `📕 به بخش راهنمای ربات خوش آمدید

📱 اتصال به سرویس‌ها در همه نوع دیوایس‌ها (آیفون، اندروید، ویندوز) امکان‌پذیر است
🔗 نحوه اتصال به سرویس‌ها را از طریق لینک‌های زیر مطالعه بفرمایید:
(برنامه مورد نیاز + آموزش قدم به قدم)`;

const guideButtons = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📲 اتصال در اندروید", url: "https://example.com/android" },
          { text: "📱 اتصال در آیفون", url: "https://example.com/ios" },
        ],
        [
          { text: "💻 اتصال در ویندوز", url: "https://example.com/windows" },
        ],
        [
          { text: "🛒 آموزش خرید از ربات", url: "https://example.com/buy" },
        ],
      ],
    },
  };
  bot.sendMessage(chatId, guideMessage, guideButtons)
};
