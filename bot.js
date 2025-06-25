// spell-checker: disable
const createTest = require("./createTest");
const handleBuyService = require("./buyService");
const handleTopUp = require("./handleTopUp");
const handleProfile = require("./handleProfile");
const handleGuide = require("./handleGuide");
const User = require("./models/User");
const keyboard = require("./keyBoard");
const handleCallbackQuery = require("./handlers/callbackHandlers")
const handleMessage = require("./handlers/messageHandlers")

const connectDB = require("./db");
connectDB();

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

if (session && session.step === "waiting_for_ton_amount") {
    return handleMessage(bot, msg);
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
  if (msg.text === "📖 راهنما") {
    handleGuide(bot, chatId);
  }

});

bot.on("contact", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const phoneNumber = msg.contact.phone_number;

  try {
    let user = await User.findOne({ telegramId: userId });
    if (!user) {
      await User.create({
        telegramId: userId,
        balance: 0,
        successfulPayments: 0,
        totalServices: 0,
        phoneNumber: phoneNumber,
      });
    } else if (!user.phoneNumber) {
      (user.phoneNumber = phoneNumber), await user.save();
    }
    bot.sendMessage(chatId, "✅ شماره تلفن شما با موفقیت ثبت شد.", keyboard);
    // await bot.sendMessage(chatId, keyboard);
    const handleProfile = require("./handleProfile");
    handleProfile(bot, chatId, userId);
  } catch (error) {
    bot.sendMessage(chatId, "❌ مشکلی در ذخیره شماره تلفن رخ داد.");
  }
});

bot.on("callback_query", async(query) => {
 await handleCallbackQuery(bot, query);
})