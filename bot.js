// * 🌍 Load env
import "dotenv/config";

// * 🔌 Core
import startBot from "./startBot.js";
import handleContact from "./handlers/contactHandler.js";
import handleCallbackQuery from "./handlers/handleCallbackQuery.js";

// * 📦 Services
import handleBuyService from "./services/buyService.js";
import showPaymentMethods from "./handlers/message/showPaymentMethods.js";
import handleProfile from "./handlers/message/handleProfile.js";
import handleGuide from "./handlers/message/handleGuide.js";
import handleSupport from "./handlers/message/handleSupport.js";
import handleMessage from "./handlers/onMessage.js";
import { WELCOME_MESSAGE } from "./messages/staticMessages.js";
import keyboard from "./keyboards/mainKeyboard.js";
import { getSession, setSession } from "./config/sessionStore.js";
import hideKeyboard from "./utils/hideKeyboard.js";
import createTestService from "./services/createTestService.js";
import User from "./models/User.js";

let adminIds = process.env.ADMINS.split(",").map((id) => Number(id.trim()));

const bot = await startBot();

// * Handle all incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userText = msg.text;
  const session = await getSession(userId);

  const { from, chat, text } = msg;

  switch (userText) {
    case "/start": {
      await bot.sendMessage(chatId, WELCOME_MESSAGE, keyboard);
      break;
    }
    case "/panel" || "پنل": {
      if (adminIds.includes(userId)) {
        const sendAdminPanels = (
          await import("./handlers/admin/sendAdminPanels.js")
        ).default;
        await sendAdminPanels(bot, chatId);
      } else {
        await bot.sendMessage(chatId, "⛔️ شما دسترسی به این بخش را ندارید.");
      }
      break;
    }
    case "🎁 سرویس تست":
      await createTestService(bot, msg);
      break;
    case "🛒 خرید سرویس":
      await handleBuyService(bot, chatId);
      break;
    case "💰 افزایش موجودی": {
      await hideKeyboard(bot, chatId);
      const user = await User.findOne({ telegramId: userId });
      if (!user || !user.phoneNumber) {
        await handleContact(bot, msg, async () => {
          await showPaymentMethods(bot, chatId);
        });
      } else {
        await showPaymentMethods(bot, chatId);
      }
      break;
    }
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
});

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

bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);

  if (session?.step === "waiting_for_receipt_image") {
    const handleBankRecipt = (
      await import("./paymentHandlers/handleBankRecipt.js")
    ).default;
    await handleBankRecipt(bot, msg, session);
  }
});
