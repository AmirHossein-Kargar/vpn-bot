module.exports = async function handleSupport(bot, chatId) {
  const supportMessage = `▫️ جهت ارتباط به صورت مستقیم:
🔰 @AmirKargaar

‼️ قبل از ارسال پیام به پشتیبانی، قوانین و مقررات سرویس‌دهی را مطالعه کنید.

📝 لطفاً پیام پشتیبانی خود را در همین چت تایپ و ارسال کنید.
`;

  const supportKeyboard = {
    reply_markup: {
     remove_keyboard: true,
      inline_keyboard: [
        [{ text: "🏠 بازگشت به منوی اصلی", callback_data: "back_to_home" }],
      ],
    },
  };
  await bot.sendMessage(chatId, supportMessage, supportKeyboard);
};
