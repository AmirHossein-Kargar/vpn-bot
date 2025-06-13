const createTest = require("./createTest");
const handleBuyService = require("./buyService");
const handleTopUp = require("./handleTopUp");
const handleProfile = require("./handleProfile")


const connectDB = require("./db")
connectDB()

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "/start") {
    const welcomeMessage = `🤖 به ربات سویفت خوش آمدید...

🚀 سویفت سرویسی از نوع شتاب دهنده اینترنت شما با لوکیشن‌های مختلف

📱 امکان اتصال در اندروید، ویندوز، آیفون و...

🌐 قابل استفاده بر روی تمام اینترنت‌ها

🔻 از این پایین یک گزینه رو انتخاب کن.️️`;

    const keyboard = {
      reply_markup: {
        keyboard: [
          ["🛒 خرید سرویس", "💰 افزایش موجودی"],
          ["📦 سرویس‌های من", "👤 پروفایل من"],
          ["🎁 سرویس تست", "📖 راهنما"],
          ["🛠 پشتیبانی"],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };

    bot.sendMessage(chatId, welcomeMessage, keyboard);
  }

  // 🎁 سرویس تست
  if (msg.text === "🎁 سرویس تست") {
    const userId = msg.from.id;
    createTest(bot, chatId, userId, process.env.VPN_API_KEY);
  }

  if (msg.text === "🛒 خرید سرویس") {
    handleBuyService(bot, chatId);
  }
    if (msg.text === "💰 افزایش موجودی") {
    handleTopUp(bot, chatId);
  }
  if(msg.text === "👤 پروفایل من") {
    const userId = msg.from.id
      handleProfile(bot, chatId, userId)
  }
});
