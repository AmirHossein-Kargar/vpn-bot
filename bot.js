// * 🌍 Load env
import "dotenv/config";

// * 🔌 Core
import startBot from "./startBot.js";
import handleCallbackQuery from "./handlers/handleCallbackQuery.js";
import handleContact from "./handlers/contactHandler.js";

// * 📦 Services & Handlers
import createTestService from "./services/createTestService.js";
import handleBuyService from "./services/buyService/buyService.js";
import handleGuide from "./handlers/message/handleGuide.js";
import handleMessage from "./handlers/onMessage.js";
import handleProfile from "./handlers/message/handleProfile.js";
import handleSupport from "./handlers/message/handleSupport.js";
import keyboard from "./keyboards/mainKeyboard.js";
import sendServiceSelectionMenu from "./services/manageServices/sendServiceSelectionMenu.js";
import showPaymentMethods from "./handlers/message/showPaymentMethods.js";
import supportMessageHandler from "./handlers/supportMessageHandler.js";

// * 📦 Utilities & Config
import { getSession, setSession } from "./config/sessionStore.js";
import hideKeyboard from "./utils/hideKeyboard.js";
import { WELCOME_MESSAGE } from "./messages/staticMessages.js";

// * 📦 Models
import User from "./models/User.js";

// * 📦 API
import { StatusApi } from "./api/wizardApi.js";
import showStatusApi from "./handlers/admin/showStatusApi.js";

// * 🛡️ Admins
let adminIds = process.env.ADMINS.split(",").map((id) => Number(id.trim()));

// * 🚀 Start Bot
const bot = await startBot();

// * 📨 Message Handler
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userText = msg.text;
  const session = await getSession(userId);

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
    case "/status": {
      await showStatusApi(bot, msg);
      break;
    }
    case "🎁 سرویس تست":
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (error) {
        console.log("❗️خطا در حذف پیام:", error.message);
      }
      await createTestService(bot, msg);
      break;
    case "🛒 خرید سرویس":
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (error) {
        console.log("❗️خطا در حذف پیام:", error.message);
      }
      await handleBuyService(bot, chatId);
      break;
    case "💰 افزایش موجودی": {
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (error) {
        console.log("❗️خطا در حذف پیام:", error.message);
      }
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
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (error) {
        console.log("❗️خطا در حذف پیام:", error.message);
      }
      await handleProfile(bot, chatId, userId);
      break;
    case "📖 راهنما":
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (error) {
        console.log("❗️خطا در حذف پیام:", error.message);
      }
      await handleGuide(bot, chatId);
      break;
    case "🛠 پشتیبانی":
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (error) {
        console.log("❗️خطا در حذف پیام:", error.message);
      }
      await handleSupport(bot, chatId, userId);
      break;
    case "📦 سرویس‌های من":
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (error) {
        console.log("❗️خطا در حذف پیام:", error.message);
      }
      await sendServiceSelectionMenu(bot, chatId, userId);
      break;
    default:
      await handleMessage(bot, msg);
  }
});

// * ☎️ Contact Handler
bot.on("contact", async (msg) => {
  try {
    await handleContact(bot, msg);
  } catch (err) {
    console.error("❌ Error in bot.on('contact'):", err);
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, "❌ مشکلی در ذخیره شماره تلفن رخ داد.");
  }
});

// * 🔘 Callback Query Handler
bot.on("callback_query", async (query) => {
  try {
    await handleCallbackQuery(bot, query);
  } catch (err) {
    console.error("❌ Error in bot.on('callback_query'):", err);
  }
});

// * 🖼️ Photo Handler (for receipt uploads and support)
bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const session = await getSession(userId);

  // Check if user is in support mode
  if (session?.support) {
    await supportMessageHandler(bot, msg);
    return;
  }

  // Handle receipt uploads
  if (session?.step === "waiting_for_receipt_image") {
    const handleBankRecipt = (
      await import("./paymentHandlers/handleBankRecipt.js")
    ).default;
    await handleBankRecipt(bot, msg, session);
  }
});

// * 🎥 Video Handler (for support)
bot.on("video", async (msg) => {
  const userId = msg.from.id;
  const session = await getSession(userId);

  if (session?.support) {
    await supportMessageHandler(bot, msg);
  }
});

// * 🔊 Voice Handler (unsupported media types for support)
bot.on("voice", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const session = await getSession(userId);

  if (session?.support) {
    try {
      // Delete the unsupported message
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (deleteError) {
        console.log("❗️خطا در حذف پیام voice:", deleteError.message);
        // Continue even if message deletion fails
      }

      // Edit the previous support message to show error
      if (session.supportMessageId) {
        try {
          await bot.editMessageText(
            `❌ این فایل مجاز نیست!\n\n▫️ جهت ارتباط به صورت مستقیم:\n🔰 @Swift_servicebot\n\n‼️ قبل از ارسال پیام به پشتیبانی، قوانین و مقررات سرویس‌ دهی را مطالعه کنید.\n\n📝 لطفاً پیام پشتیبانی خود را در همین چت تایپ و ارسال کنید.\n\n✅ فایل‌های مجاز: متن، عکس، فیلم`,
            {
              chat_id: chatId,
              message_id: session.supportMessageId,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🏠 بازگشت به منوی اصلی",
                      callback_data: "back_to_home",
                    },
                  ],
                ],
              },
            }
          );
        } catch (editError) {
          console.log("❗️خطا در ویرایش پیام پشتیبانی:", editError.message);
        }
      }
    } catch (error) {
      console.error("❌ Error deleting unsupported voice message:", error);
    }
  }
});

// * 🎥 Video Note Handler (unsupported media types for support)
bot.on("video_note", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const session = await getSession(userId);

  if (session?.support) {
    try {
      // Delete the unsupported message
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (deleteError) {
        console.log("❗️خطا در حذف پیام video_note:", deleteError.message);
        // Continue even if message deletion fails
      }

      // Edit the previous support message to show error
      if (session.supportMessageId) {
        try {
          await bot.editMessageText(
            `❌ این فایل مجاز نیست!\n\n▫️ جهت ارتباط به صورت مستقیم:\n🔰 @Swift_servicebot\n\n‼️ قبل از ارسال پیام به پشتیبانی، قوانین و مقررات سرویس‌ دهی را مطالعه کنید.\n\n📝 لطفاً پیام پشتیبانی خود را در همین چت تایپ و ارسال کنید.\n\n✅ فایل‌های مجاز: متن، عکس، فیلم`,
            {
              chat_id: chatId,
              message_id: session.supportMessageId,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🏠 بازگشت به منوی اصلی",
                      callback_data: "back_to_home",
                    },
                  ],
                ],
              },
            }
          );
        } catch (editError) {
          console.log("❗️خطا در ویرایش پیام پشتیبانی:", editError.message);
        }
      }
    } catch (error) {
      console.error("❌ Error deleting unsupported video_note message:", error);
    }
  }
});

// * 📄 Document Handler (unsupported media types for support)
bot.on("document", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const session = await getSession(userId);

  if (session?.support) {
    try {
      // Delete the unsupported message
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (deleteError) {
        console.log("❗️خطا در حذف پیام document:", deleteError.message);
        // Continue even if message deletion fails
      }

      // Edit the previous support message to show error
      if (session.supportMessageId) {
        try {
          await bot.editMessageText(
            `❌ این فایل مجاز نیست!\n\n▫️ جهت ارتباط به صورت مستقیم:\n🔰 @Swift_servicebot\n\n‼️ قبل از ارسال پیام به پشتیبانی، قوانین و مقررات سرویس‌ دهی را مطالعه کنید.\n\n📝 لطفاً پیام پشتیبانی خود را در همین چت تایپ و ارسال کنید.\n\n✅ فایل‌های مجاز: متن، عکس، فیلم`,
            {
              chat_id: chatId,
              message_id: session.supportMessageId,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🏠 بازگشت به منوی اصلی",
                      callback_data: "back_to_home",
                    },
                  ],
                ],
              },
            }
          );
        } catch (editError) {
          console.log("❗️خطا در ویرایش پیام پشتیبانی:", editError.message);
        }
      }
    } catch (error) {
      console.error("❌ Error deleting unsupported document message:", error);
    }
  }
});
