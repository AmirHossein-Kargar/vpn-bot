const createTest = require("./createTest");
const handleBuyService = require("./buyService");
const handleTopUp = require("./handleTopUp");
const handleProfile = require("./handleProfile");
const User = require("./models/User");

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


const connectDB = require("./db");
connectDB();

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.contact) {
    const phoneNumber = msg.contact.phone_number;
    const telegramId = msg.from.id;

    let formattedPhone = phoneNumber;
    if (formattedPhone.startsWith("+98")) {
      formattedPhone = formattedPhone.replace("+98", "0");
    }

    try {
      await User.findOneAndUpdate(
        { telegramId },
        { phoneNumber: formattedPhone },
        { new: true }
      );
      bot.sendMessage(
        chatId,
        "✅ شماره تلفن شما با موفقیت ذخیره شد.\nدوباره روی «👤 پروفایل من» کلیک کنید.",
        keyboard
      );
    } catch (error) {
      bot.sendMessage(chatId, "❌ مشکلی در ذخیره شماره پیش آمد.");
    }
    return;
  }

  if (msg.text === "/start") {
    const welcomeMessage = `🤖 به ربات سویفت خوش آمدید...

🚀 سویفت سرویسی از نوع شتاب دهنده اینترنت شما با لوکیشن‌های مختلف

📱 امکان اتصال در اندروید، ویندوز، آیفون و...

🌐 قابل استفاده بر روی تمام اینترنت‌ها

🔻 از این پایین یک گزینه رو انتخاب کن.️️`;


    bot.sendMessage(chatId, welcomeMessage, keyboard);
  }

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
  if (msg.text === "👤 پروفایل من") {
    const userId = msg.from.id;
    handleProfile(bot, chatId, userId);
  }
});
