const deactivateService = async (bot, chatId, messageId, data, query) => {
  const username = data.split("deactivate_service_")[1];
  const res = await deactiveService(username);
  if (res && res.result) {
    await bot.editMessageText(
    `سرویس با موفقیت ${res.status === "active" ? "فعال" : "غیرفعال"} شد.\n\n<a href="https://t.me/swift_shield/12">غیرفعال کردن سرویس چیست؟</a>`,
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
  await bot.editMessageText("❌ خطا در غیر فعال کردن سرویس.", {
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
}
export default deactivateService;