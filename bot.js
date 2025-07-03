// * Load environment variables
require("dotenv").config();
// * ✅ THEN require other stuff
const createTest = require("./services/createTest");
const handleBuyService = require("./services/buyService");
const handleTopUp = require("./handlers/message/handleTopUp");
const handleProfile = require("./handlers/message/handleProfile");
const handleGuide = require("./handlers/message/handleGuide");
const handleSupport = require("./handlers/message/handleSupport");
const connectDB = require("./config/db");
const initSessionStore = require("./config/sessionStore").initSessionStore;
const { WELCOME_MESSAGE } = require("./messages/staticMessages");
const User = require("./models/User");
const keyboard = require("./keyboards/mainKeyboard");
const handleCallbackQuery = require("./handlers/handleCallbackQuery");
const handleMessage = require("./handlers/onMessage");
const storage = require("node-persist");

// * Initialize Telegram Bot with polling
const TelegramBot = require("node-telegram-bot-api");
const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

(async () => {
  try {
    await connectDB();
    await initSessionStore();
    console.log("✅ Database & Session store initialized!");
  } catch (err) {
    console.error("❌ Failed to initialize DB or Session Store:", err);
    process.exit(1);
  }
})();

// * Handle all incoming messages
bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userText = msg.text;
    // const commandsToDelete = [
    //   "/start",
    //   "🛠 پشتیبانی",
    //   "🎁 سرویس تست",
    //   "🛒 خرید سرویس",
    //   "💰 افزایش موجودی",
    //   "👤 پروفایل من",
    //   "📖 راهنما",
    // ];

    // if (commandsToDelete.includes(userText)) {
    //   await bot.deleteMessage(chatId, msg.message_id);
    // }

    const supportGroupId = -1002781166798;

    if (await storage.getItem(`support_${userId}`)) {
      
      await bot.sendMessage(
        supportGroupId,
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
    }

    await handleMessage(bot, msg);
  } catch (err) {
    console.error("❌ Error in bot.on('message'):", err);
  }
});

// * Handle phoneNumber contact sharing
bot.on("contact", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const phoneNumber = msg.contact.phone_number;

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
      user.phoneNumber = phoneNumber;
      await user.save();
    }

    await bot.sendMessage(
      chatId,
      "✅ شماره تلفن شما با موفقیت ثبت شد.",
      keyboard
    );
    await handleProfile(bot, chatId, userId);
  } catch (err) {
    console.error("❌ Error in bot.on('contact'):", err);
    await bot.sendMessage(chatId, "❌ مشکلی در ذخیره شماره تلفن رخ داد.");
  }
});

// * Handle inline button (callback_query)
bot.on("callback_query", async (query) => {
  try {
    await handleCallbackQuery(bot, query);
  } catch (err) {
    console.error("❌ Error in bot.on('callback_query'):", err);
  }
});
