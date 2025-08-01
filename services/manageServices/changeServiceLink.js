import User from "../../models/User.js";
import { changeLinkService } from "../../api/wizardApi.js";

const changeServiceLink = async (bot, chatId, messageId, data, query = {}) => {
  const userId = query?.from?.id ? String(query.from.id) : undefined;
  let username;
  try {
    username = data.split("change_link_")[1];
  const res = await changeLinkService(username);

  // Check if API call was successful
  if (!res || !res.result || !res.result.new_sub_link) {
    console.error("Failed to change link:", res);
    await bot.editMessageText(
      "❌ خطا در تغییر لینک. لطفاً دوباره تلاش کنید.",
      {
        chat_id: chatId,
        message_id: messageId,
      }
    );
    return;
  }

  // Update the database using findOneAndUpdate for better reliability
  const updateResult = await User.findOneAndUpdate(
    {
      telegramId: userId,
      "services.username": username,
    },
    {
      $set: {
        "services.$.sub_link": res.result.new_sub_link,
      },
    },
    { new: true }
  );

    if (!updateResult) {
      console.error("User or service not found for update");
      await bot.editMessageText(
        "❌ خطا در بروزرسانی اطلاعات. لطفاً دوباره تلاش کنید.",
        {
          chat_id: chatId,
          message_id: messageId,
        }
      );
      return;
    }

    await bot.editMessageText(
      `🔗 لینک اتصال شما با موفقیت تغییر کرد.\n\n🔸 جهت دریافت اطلاعات سرویس و مشاهده لینک جدید، بر روی گزینه بازگشت کلیک بفرمایید .`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "بازگشت",
                callback_data: `show_service_${username}`,
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Error in changeServiceLink:", error);
    await bot.editMessageText(
      "❌ خطا در تغییر لینک. لطفاً دوباره تلاش کنید.",
      {
        chat_id: chatId,
        message_id: messageId,
      }
    );
  }
};

export default changeServiceLink;