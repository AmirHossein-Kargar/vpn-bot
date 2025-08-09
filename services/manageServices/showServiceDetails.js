import { findService } from "../../api/wizardApi.js";
import User from "../../models/User.js";

// Helper function to remove service from database
const removeServiceFromDatabase = async (username) => {
  try {
    const user = await User.findOne({ "services.username": username });

    if (!user) {
      return { success: false, message: "کاربر یافت نشد" };
    }

    const newTotal = Math.max(0, (user.totalServices || 0) - 1);

    const updateResult = await User.updateOne(
      { telegramId: user.telegramId },
      {
        $pull: { services: { username: username } },
        $set: { totalServices: newTotal },
      }
    );

    // Verify the service was actually removed
    const updatedUser = await User.findOne({ "services.username": username });
    if (updatedUser) {
      return { success: false, message: "خطا در حذف سرویس از دیتابیس" };
    } else {
      return {
        success: true,
        message: `سرویس ${username} از سیستم حذف شده و از لیست شما نیز حذف شد.`,
        modifiedCount: updateResult.modifiedCount,
      };
    }
  } catch (error) {
    return { success: false, message: "خطا در حذف سرویس از دیتابیس" };
  }
};

const showServiceDetails = async (bot, chatId, username, messageId) => {
  try {
    const apiResponse = await findService(username);

    // Check if service doesn't exist in API (response is false/undefined/null)
    if (!apiResponse || apiResponse === false) {
      // Remove service from database since it doesn't exist in API
      const removalResult = await removeServiceFromDatabase(username);

      // Prepare message
      const messageText = `❌ سرویس <code>${username}</code> یافت نشد.`;

      // Edit the previous message if messageId is provided
      if (messageId) {
        try {
          await bot.editMessageText(messageText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 بازگشت به منوی اصلی",
                    callback_data: "buy_service_back_to_main",
                  },
                ],
              ],
            },
          });
        } catch (editError) {
          // If editing fails, send a new message
          await bot.sendMessage(chatId, messageText, {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 بازگشت به منوی اصلی",
                    callback_data: "buy_service_back_to_main",
                  },
                ],
              ],
            },
          });
        }
      } else {
        // If no messageId, send a new message
        await bot.sendMessage(chatId, messageText, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 بازگشت به منوی اصلی",
                  callback_data: "buy_service_back_to_main",
                },
              ],
            ],
          },
        });
      }
      return;
    }

    // Check if API returned an error
    if (apiResponse.error) {
      // Service might be deleted from API, remove it from database
      const removalResult = await removeServiceFromDatabase(username);

      // Prepare message based on removal result
      let messageText;
      if (removalResult.success) {
        messageText = `❌ ${removalResult.message}`;
      } else {
        messageText = `❌ سرویس <code>${username}</code> یافت نشد. ${removalResult.message}`;
      }

      // Edit the previous message if messageId is provided
      if (messageId) {
        try {
          await bot.editMessageText(messageText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 بازگشت به منوی اصلی",
                    callback_data: "buy_service_back_to_main",
                  },
                ],
              ],
            },
          });
        } catch (editError) {
          // If editing fails, send a new message
          await bot.sendMessage(chatId, messageText, {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 بازگشت به منوی اصلی",
                    callback_data: "buy_service_back_to_main",
                  },
                ],
              ],
            },
          });
        }
      } else {
        // If no messageId, send a new message
        await bot.sendMessage(chatId, messageText, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 بازگشت به منوی اصلی",
                  callback_data: "buy_service_back_to_main",
                },
              ],
            ],
          },
        });
      }
      return;
    }

    // Additional check for empty or invalid result
    if (!apiResponse.result || typeof apiResponse.result !== "object") {
      // Try to remove from database as well
      const removalResult = await removeServiceFromDatabase(username);

      const messageText = `❌ سرویس <code>${username}</code> یافت نشد یا اطلاعات آن نامعتبر است.`;

      if (messageId) {
        try {
          await bot.editMessageText(messageText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 بازگشت به منوی اصلی",
                    callback_data: "buy_service_back_to_main",
                  },
                ],
              ],
            },
          });
        } catch (editError) {
          // If editing fails, send a new message
          await bot.sendMessage(chatId, messageText, {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 بازگشت به منوی اصلی",
                    callback_data: "buy_service_back_to_main",
                  },
                ],
              ],
            },
          });
        }
      } else {
        await bot.sendMessage(chatId, messageText, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 بازگشت به منوی اصلی",
                  callback_data: "buy_service_back_to_main",
                },
              ],
            ],
          },
        });
      }
      return;
    }

    const res = apiResponse.result;
    if (!res) {
      await bot.sendMessage(chatId, "❌ اطلاعات سرویس یافت نشد.");
      return;
    }

    const online = res.online_info || {};
    const latest = res.latest_info || {};

    const expireDatePersian = latest.expire_date || "نامشخص";
    const daysLeft = latest.day ?? "نامشخص";

    const smartLink = res.hash
      ? `https://iranisystem.com/bot/sub/?hash=${res.hash}`
      : res.sub_link || "";

    const message = `
    #⃣ کد سرویس : <code>${res.username}</code>

▫️ وضعیت سرویس : ${
      online.status === "active"
        ? "<code>🟢 فعال</code>"
        : online.status === "limited"
        ? "<code>🔴 منقضی شده</code>"
        : "🔴 غیرفعال"
    }

📦 حجم سرویس : <code>${latest.gig || "نامشخص"} گیگابایت</code>
📥 حجم مصرفی : <code>${online.usage_converted || 0}</code>
📅 تاریخ انقضا : <code>${expireDatePersian} | ${daysLeft} روز دیگر</code>

🔗 لینک اتصال (Subscription) :

<code>${smartLink}</code>

▫️ یکی از گزینه های زیر را انتخاب کنید.`;

    if (messageId) {
      // Always delete the current message and send a new one to avoid edit conflicts
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (deleteError) {
        // Message deletion failed, continue with sending new message
      }

      // Create inline keyboard based on service status
      const inlineKeyboard = [
        [
          {
            text: "‼️چجوری به سرویس متصل بشم‼️",
            url: "https://t.me/swift_shield/9",
          },
        ],
      ];

      // Only show change link button if status is not limited
      if (online.status !== "limited") {
        inlineKeyboard.push([
          {
            text: "🛑 تغییر لینک 🛑",
            callback_data: `change_link_${res.username}`,
          },
          {
            text: "⏳ افزایش زمان",
            callback_data: `extend_service_${res.username}`,
          },
          {
            text: "📦 افزایش حجم",
            callback_data: `extend_data_${res.username}`,
          },
        ]);
      } else {
        // For limited status, only show extend service button
        inlineKeyboard.push([
          {
            text: "⏳ افزایش زمان",
            callback_data: `extend_service_${res.username}`,
          },
          {
            text: "📦 افزایش حجم",
            callback_data: `extend_data_${res.username}`,
          },
        ]);
      }

      inlineKeyboard.push([
        {
          text: "🗑 حذف سرویس",
          callback_data: `delete_service_${res.username}`,
        },
        {
          text: "◽️دریافت QRCode",
          callback_data: `qrcode_${res.username}`,
        },
      ]);

      // Only show activate/deactivate button if status is not limited
      if (online.status !== "limited") {
        inlineKeyboard.push([
          {
            text: `${
              online.status === "active"
                ? "🚫 غیر فعال کردن سرویس"
                : "✅ فعال کردن سرویس"
            }`,
            callback_data: `deactivate_service_${res.username}`,
          },
        ]);
      }

      inlineKeyboard.push([
        {
          text: "بازگشت به منوی اصلی",
          callback_data: "buy_service_back_to_main",
        },
      ]);

      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      });
    }
  } catch (error) {
    await bot.sendMessage(chatId, "❌ خطایی رخ داد، لطفا دوباره تلاش کنید.");
  }
};

export default showServiceDetails;
