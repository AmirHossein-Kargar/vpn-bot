import { getSession, setSession } from "../config/sessionStore.js";
import User from "../models/User.js";
import keyboard from "../keyboards/mainKeyboard.js";

const supportMessageHandler = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const session = await getSession(userId);
  if (!session?.support) return;

  // * GET USER INFO
  const user = await User.findOne({ telegramId: String(userId) });
  const groupId = process.env.GROUP_ID;

  const userInfo =
    `👤 کاربر: ${msg.from.first_name || "نامشخص"}\n` +
    `🔗 یوزرنیم: @${msg.from.username || "ندارد"}\n` +
    ` آیدی عددی: <code>${userId}</code>` +
    (user?.balance !== undefined
      ? `\n💰 موجودی: <code>${user.balance.toLocaleString()} تومان</code>`
      : "");

  let mediaType = "";
  let mediaContent = "";
  let mediaFile = null;

  // * CHECK MESSAGE TYPE
  if (msg.text) {
    mediaType = "📝 متن";
    mediaContent = msg.text;
  } else if (msg.photo && msg.photo.length > 0) {
    mediaType = "🖼 عکس";
    mediaContent = msg.caption || "";
    mediaFile = msg.photo[msg.photo.length - 1]; // Get the largest photo
  } else if (msg.video) {
    mediaType = "🎥 فیلم";
    mediaContent = msg.caption || "";
    mediaFile = msg.video;
  } else {
    // Unknown media type - delete the message and edit previous message
    try {
      // Delete the unsupported message
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (error) {
        console.log("❗️خطا در حذف پیام نامعتبر:", error.message);
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
          // Send a new message if editing fails
          await bot.sendMessage(
            chatId,
            `❌ این فایل مجاز نیست!\n\n▫️ جهت ارتباط به صورت مستقیم:\n🔰 @Swift_servicebot\n\n‼️ قبل از ارسال پیام به پشتیبانی، قوانین و مقررات سرویس‌ دهی را مطالعه کنید.\n\n📝 لطفاً پیام پشتیبانی خود را در همین چت تایپ و ارسال کنید.\n\n✅ فایل‌های مجاز: متن، عکس، فیلم`,
            {
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
        }
      }
    } catch (error) {
      console.error("❌ Error deleting unsupported message:", error);
    }
    return;
  }

  try {
    // * SEND TO SUPPORT GROUP
    if (mediaFile) {
      // Send media with caption
      const mediaOptions = {
        caption: `📩 <b>پیام جدید پشتیبانی</b>\n\n${userInfo}${
          mediaContent ? `\n\n${mediaType}:\n${mediaContent}` : ""
        }`,
        parse_mode: "HTML",
      };

      if (mediaType === "🖼 عکس") {
        await bot.sendPhoto(groupId, mediaFile.file_id, mediaOptions);
      } else if (mediaType === "🎥 فیلم") {
        await bot.sendVideo(groupId, mediaFile.file_id, mediaOptions);
      }
    } else {
      // Send text message
      await bot.sendMessage(
        groupId,
        `📩 <b>پیام جدید پشتیبانی</b>\n\n${userInfo}\n\n${mediaType}:\n${mediaContent}`,
        { parse_mode: "HTML" }
      );
    }

    // * SEND CONFIRMATION TO USER
    if (session.supportMessageId) {
      try {
        await bot.editMessageText(
          `✅ ${mediaType} شما با موفقیت برای پشتیبانی ارسال شد`,
          {
            chat_id: chatId,
            message_id: session.supportMessageId,
            reply_markup: keyboard.reply_markup,
          }
        );
      } catch (editError) {
        console.log("❗️خطا در ویرایش پیام پشتیبانی:", editError.message);
        // اگر ادیت نشد، پیام جدید ارسال کن
        await bot.sendMessage(
          chatId,
          `✅ ${mediaType} شما با موفقیت برای پشتیبانی ارسال شد`,
          keyboard
        );
      }
    } else {
      // اگر messageId نبود، پیام جدید ارسال کن
      await bot.sendMessage(
        chatId,
        `✅ ${mediaType} شما با موفقیت برای پشتیبانی ارسال شد`,
        keyboard
      );
    }

    // * CLEAR THE SUPPORT SESSION
    session.support = false;
    session.supportMessageId = null;
    await setSession(userId, session);
  } catch (error) {
    console.error("❌ Error in supportMessageHandler:", error);
    await bot.sendMessage(
      chatId,
      "❌ مشکلی در ارسال پیام به پشتیبانی رخ داد. لطفاً دوباره تلاش کنید.",
      keyboard
    );
  }
};

export default supportMessageHandler;
