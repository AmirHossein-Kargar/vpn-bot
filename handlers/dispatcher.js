// * 🛠️ Handlers & Services
const createTest = require("../services/createTest");
const handleBuyService = require("../services/buyService");
const handleTopUp = require("../handlers/message/handleTopUp");
const handleProfile = require("../handlers/message/handleProfile");
const handleGuide = require("../handlers/message/handleGuide");
const handleSupport = require("../handlers/message/handleSupport");
const handleMessage = require("../handlers/onMessage");
const { WELCOME_MESSAGE } = require("../messages/staticMessages");
const keyboard = require("../keyboards/mainKeyboard");
const {storage} = require("../config/sessionStore")

const SUPPORT_GROUP_ID = -1002781166798;

module.exports = async function handleMessageDispatcher(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userText = msg.text;

  if (await storage.getItem(`support_${userId}`)) {
    await bot.sendMessage(
      SUPPORT_GROUP_ID,
      `📩 پیام پشتیبانی از کاربر <a href="tg://user?id=${userId}">${msg.from.first_name}</a>:\n\n${userText}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✉️ پاسخ به کاربر",
                callback_data: `reply_${userId}`,
              },
            ],
          ],
        },
      }
    );

    await bot.sendMessage(
      chatId,
      "✅ پیام شما به پشتیبانی ارسال شد.",
      keyboard
    );
    await storage.removeItem(`support_${userId}`);
    return;
  }

  switch (userText) {
    case "/start": {
      await bot.sendMessage(chatId, WELCOME_MESSAGE, keyboard);
      break;
    }
    case "🎁 سرویس تست":
      await createTest(bot, chatId, userId, process.env.VPN_API_KEY);
      break;
    case "🛒 خرید سرویس":
      await handleBuyService(bot, chatId);
      break;
    case "💰 افزایش موجودی":
      await handleTopUp(bot, chatId);
      break;
    case "👤 پروفایل من":
      await handleProfile(bot, chatId, userId);
      break;
    case "📖 راهنما":
      await handleGuide(bot, chatId);
      break;
    case "🛠 پشتیبانی":
      await handleSupport(bot, chatId, userId);
      break;
    default:
     await handleMessage(bot, msg);
  }
};
