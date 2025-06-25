const createTest = require("./createTest");
const handleBuyService = require("./buyService");
const handleTopUp = require("./handleTopUp");
const handleProfile = require("./handleProfile");
const handleGuide = require("./handleGuide");

// * User model for MongoDB
const User = require("./models/User");

// * Main Keyboard markup
const keyboard = require("./keyBoard");

// * Handlers for callback queries and messages
const handleCallbackQuery = require("./handlers/callbackHandlers");
const handleMessage = require("./handlers/messageHandlers");

// * Connect to MongoDB Database
const connectDB = require("./db");
connectDB();

// * Load environment variables
require("dotenv").config();

// * Initialize Telegram Bot with polling
const TelegramBot = require("node-telegram-bot-api");
const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

// * Handle all incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // * Handle start command
  if (msg.text === "/start") {
    const welcomeMessage = `🤖 به ربات سویفت خوش آمدید...

🚀 سویفت سرویسی از نوع شتاب دهنده اینترنت شما با لوکیشن‌های مختلف

📱 امکان اتصال در اندروید، ویندوز، آیفون و...

🌐 قابل استفاده بر روی تمام اینترنت‌ها

🔻 از این پایین یک گزینه رو انتخاب کن.️️`;

    bot.sendMessage(chatId, welcomeMessage, keyboard);
  }

  // * Handle "Test Service"
  if (msg.text === "🎁 سرویس تست") {
    const userId = msg.from.id;
    createTest(bot, chatId, userId, process.env.VPN_API_KEY);
  }

  // * Handle "Buy Service"
  if (msg.text === "🛒 خرید سرویس") {
    handleBuyService(bot, chatId);
  }

  // * Handle "Top Up Balance"
  if (msg.text === "💰 افزایش موجودی") {
    handleTopUp(bot, chatId);
  }

  // * Handle "My Profile"
  if (msg.text === "👤 پروفایل من") {
    const userId = msg.from.id;
    handleProfile(bot, chatId, userId);
  }

  // * Handle "Guide"
  if (msg.text === "📖 راهنما") {
    handleGuide(bot, chatId);
  }

  await handleMessage(bot, msg);
});

// * Handle phoneNumber contact sharing
bot.on("contact", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const phoneNumber = msg.contact.phone_number;

  try {
    let user = await User.findOne({ telegramId: userId });

    // * Create new user if not exists
    if (!user) {
      await User.create({
        telegramId: userId,
        balance: 0,
        successfulPayments: 0,
        totalServices: 0,
        phoneNumber: phoneNumber,
      });
      // * Update PhoneNumber if missing
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

// * Handle inline button (callback_query)
bot.on("callback_query", async (query) => {
  await handleCallbackQuery(bot, query);
});
