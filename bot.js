const handleCallbackQuery = require("./handlers/handleCallbackQuery");
const handleMessageDispatcher = require("./handlers/dispatcher")
// * 🌍 Load env
require("dotenv").config();
// * 🔌 Core
const TelegramBot = require("node-telegram-bot-api");
// * ⚙️ Config
const connectDB = require("./config/db");
const { initSessionStore, storage } = require("./config/sessionStore");
// * 🗃️ Constants
const handleContact = require("./handlers/contactHandler");
// * 🤖 Init Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// * 🔌 Init DB & Session
(async () => {
  try {
    await connectDB();
    await initSessionStore();
    console.log("✅ DB & SessionStore Ready");
  } catch (err) {
    console.error("❌ Init Failed:", err);
    process.exit(1);
  }
})();

// * Handle all incoming messages
bot.on("message", (msg) => handleMessageDispatcher(bot, msg))

// * Handle phoneNumber contact sharing
bot.on("contact", async (msg) => {
  try {
    await handleContact(bot, msg);
  } catch (err) {
    console.error("❌ Error in bot.on('contact'):", err);
    const chatId = msg.chat.id;
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
