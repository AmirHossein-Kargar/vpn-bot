const fs = require("fs");
const path = require("path");
const axios = require("axios");

const FILE_PATH = path.join(__dirname, "usedTestUsers.json");

function readUsedUsers() {
  if (!fs.existsSync(FILE_PATH)) return new Set();
  const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
  return new Set(data);
}

function saveUsedUsers(set) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([...set]), "utf-8");
}

async function createTest(bot, chatId, userId, VPN_API_KEY) {
  const usedUsers = readUsedUsers();

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
      usedUsers.add(userId);
      saveUsedUsers(usedUsers);

      const result = data.result;
      const randomTakLink = result.tak_links[Math.floor(Math.random() * result.tak_links.length)];
      const locationName = decodeURIComponent(randomTakLink.split("#")[1] || "ناشناخته");

      const message = `🎉 سرویس تست 1 روزه شما با موفقیت فعال شد.

👤 حداکثر اتصال: 1 کاربر
📥 مصرف مجاز: 2 گیگابایت

🔗 لینک هوشمند اتصال (شامل تمام لوکیشن‌ها):
${result.sub_link}

👈 لینک تکی از لوکیشن پیشنهادی : (${locationName})
${randomTakLink}

⚠️ کانکشن‌های ما از نوع هوشمند (Subscription) می‌باشد و برای اتصال به لینک هوشمند می‌بایست راهنمای زیر را مشاهده کنید.`;

      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, `❌ خطا: ${data.error}`);
    }
  } catch (err) {
    bot.sendMessage(
      chatId,
      `⚠️ خطای سرور:\n${err.response?.data?.error || err.message}`
    );
  }
}

module.exports = createTest;
