const hideKeyboard = async (bot, chatId) => {
  try {
    const tempMsg = await bot.sendMessage(chatId, "⏳", {
      reply_markup: {
        remove_keyboard: true,
      },
    });
   
   await new Promise(resolve => setTimeout(resolve, 100))
   
    // Delete the message after sending
    await bot.deleteMessage(chatId, tempMsg.message_id).catch(() => {});
  } catch (error) {
    console.log(error);
  }
};
export default hideKeyboard;
