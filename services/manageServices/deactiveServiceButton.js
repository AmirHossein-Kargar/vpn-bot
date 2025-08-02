import { deactiveService } from "../../api/wizardApi.js";

const deactivateServiceButton = async (bot, chatId, messageId, data, query) => {
  const username = data.split("deactivate_service_")[1];
  const res = await deactiveService(username);

  const status = res.result?.new_mode;

  if (status === "active" || status === "disabled") {
    const statusText = status === "active" ? "فعال" : "غیرفعال";
    await bot.editMessageText(
      `سرویس با موفقیت ${statusText} شد.\n\n<a href="https://t.me/swift_shield/12">غیرفعال کردن سرویس چیست؟</a>`,
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
  } else {
    await bot.editMessageText("❌ خطا در فعال/غیرفعال کردن سرویس.", {
      chat_id: chatId,
      message_id: messageId,
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
    });
  }
};

export default deactivateServiceButton;