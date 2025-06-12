require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TOKEN = process.env.BOT_TOKEN;
const VPN_API_KEY = process.env.VPN_API_KEY;

const bot = new TelegramBot(TOKEN, { polling: true });

const usedUsers = new Set();

bot.onText(/\/create_test/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (usedUsers.has(userId)) {
    bot.sendMessage(chatId, "⚠️ شما قبلاً یک بار سرویس تست دریافت کرده‌اید.");
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("test", 1);
    const res = await axios.post(
      "https://robot.wizardxray.shop/bot/api/v1/create",
      formData,
      {
        headers: {
          Authorization: `Bearer ${VPN_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = res.data;

    if (data.ok) {
      usedUsers.add(userId)
      bot.sendMessage(
        chatId,
        `✅ سرویس تست ساخته شد!\n🔗 لینک: ${data.result.link}`
      );
    } else {
      bot.sendMessage(chatId, `❌ خطا: ${data.error}`);
    }
  } catch (err) {
    bot.sendMessage(
      chatId,
      `⚠️ خطای سرور:\n${err.response?.data?.error || err.message}`
    );
  }
});
