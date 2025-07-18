// * This function handles the "guide" section of the bot

const handleGuide = (bot, chatId) => {
  // * Main message shown to the user
  const guideMessage = `📕 به بخش راهنمای ربات خوش آمدید

📱 اتصال به سرویس‌ها در همه نوع دیوایس‌ها (آیفون، اندروید، ویندوز) امکان‌پذیر است
🔗 نحوه اتصال به سرویس‌ها را از طریق لینک‌های زیر مطالعه بفرمایید:
(برنامه مورد نیاز + آموزش قدم به قدم)`;

  // * Inline buttons with external links to tutorials for each platform
  // * Android, iOS, Windows, and a guide for purchasing from the bot
  const guideButtons = {
    reply_markup: {
      inline_keyboard: [
        [
          // * Android connection guide
          { text: "📲 اتصال در اندروید", url: "https://example.com/android" },
          // * iOS connection guide
          { text: "📱 اتصال در آیفون", url: "https://example.com/ios" },
        ],
        [
          // * Windows connection guide
          { text: "💻 اتصال در ویندوز", url: "https://example.com/windows" },
        ],
        [
          // * Guide for purchasing from the bot
          { text: "🛒 آموزش خرید از ربات", url: "https://example.com/buy" },
        ],
      ],
    },
  };
  // * Send the message and the inline keyboard to the user
  bot.sendMessage(chatId, guideMessage, guideButtons);
};

export default handleGuide;
