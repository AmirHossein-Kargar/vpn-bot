import trxScanner from "../../services/trxWalletScanner.js";
import CryptoInvoice from "../../models/CryptoInvoice.js";
import invoice from "../../models/invoice.js";
import User from "../../models/User.js";
import { plans30, plans60, plans90 } from "../../services/plans.js";

// ارسال پیام به گروه ادمین
const sendToAdminGroup = async (bot, message, keyboard = null) => {
  const groupId = process.env.GROUP_ID;

  if (!groupId) {
    console.error("❌ GROUP_ID not found in environment variables");
    return;
  }

  try {
    const options = {
      parse_mode: "HTML",
    };

    if (keyboard) {
      options.reply_markup = keyboard;
    }

    const result = await bot.sendMessage(groupId, message, options);
    return result;
  } catch (error) {
    console.error("❌ Error sending message to admin group:", error.message);
    throw error;
  }
};

// کیبورد گروه ادمین
const getGroupKeyboard = () => {
  const keyboard = {
    reply_markup: {
      keyboard: [
        ["🔍 اسکن ولت TRX", "📊 وضعیت سیستم"],
        ["📋 سفارشات جدید", "💰 گزارش مالی"],
        ["⚙️ تنظیمات", "🆘 پشتیبانی"],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };

  return keyboard;
};

// ارسال پیام خوش‌آمدگویی به گروه
const sendWelcomeMessage = async (bot) => {
  try {
    const message = `🏠 <b>خوش آمدید به گروه مدیریت</b>

🔧 <b>دسترسی‌های موجود:</b>
• 🔍 اسکن ولت TRX
• 📊 مشاهده وضعیت سیستم
• 📋 مدیریت سفارشات
• 💰 گزارش‌های مالی
• ⚙️ تنظیمات سیستم

💡 <b>راهنما:</b>
برای استفاده از کیبورد، روی دکمه‌های زیر کلیک کنید.`;

    await sendToAdminGroup(bot, message, getGroupKeyboard());
  } catch (error) {
    console.error("❌ Error sending welcome message:", error.message);
  }
};

// مدیریت پیام‌های گروه
const handleGroupMessage = async (bot, msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;

  // فقط در گروه ادمین
  if (chatId.toString() !== process.env.GROUP_ID) {
    return;
  }

  // فقط ادمین‌ها مجازند
  const adminIds = (process.env.ADMINS || "")
    .split(",")
    .filter(Boolean)
    .map((id) => Number(id.trim()));
  if (!adminIds.includes(Number(userId))) {
    return;
  }

  switch (text) {
    case "/panel":
    case "پنل": {
      await bot.sendMessage(chatId, "🔒 پنل مدیریت", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔍 اسکن ولت TRX",
                callback_data: "admin_scan_trx_wallet",
              },
              {
                text: "📊 وضعیت سیستم",
                callback_data: "admin_status",
              },
            ],
            [
              {
                text: "💰 گزارش مالی",
                callback_data: "admin_financial_report",
              },
              {
                text: "📨 ارسال پیام به کاربر",
                callback_data: "admin_send_message_to_user",
              },
            ],
          ],
        },
      });
      break;
    }
    case "🔍 اسکن ولت TRX":
      await handleTrxScan(bot, msg);
      break;
    case "📊 وضعیت سیستم":
      await handleSystemStatus(bot, msg);
      break;
    case "📋 سفارشات جدید":
      await handleNewOrders(bot, msg);
      break;
    case "💰 گزارش مالی":
      await handleFinancialReport(bot, msg);
      break;
    case "⚙️ تنظیمات":
      await handleSettings(bot, msg);
      break;
    case "🆘 پشتیبانی":
      await handleSupport(bot, msg);
      break;
    default:
      // پیام‌های عادی را نادیده بگیر
      break;
  }
};

// اسکن دستی ولت TRX
const handleTrxScan = async (bot, msg) => {
  const chatId = msg.chat.id;

  try {
    // ارسال پیام در حال اسکن
    const scanningMsg = await bot.sendMessage(
      chatId,
      "🔍 در حال اسکن ولت TRX...\n\n⏳ لطفاً صبر کنید..."
    );

    // اجرای اسکن دستی
    await trxScanner.manualScan();

    // ارسال پیام موفقیت
    await bot.sendMessage(
      chatId,
      "✅ اسکن ولت TRX با موفقیت انجام شد!\n\n📊 نتایج در console نمایش داده می‌شود."
    );
  } catch (error) {
    console.error("❌ Error in TRX wallet scan:", error.message);

    await bot.sendMessage(
      chatId,
      `❌ خطا در اسکن ولت TRX:\n\n${error.message}`
    );
  }
};

// وضعیت سیستم
const handleSystemStatus = async (bot, msg) => {
  const chatId = msg.chat.id;

  const message = `📊 <b>وضعیت سیستم</b>

🟢 <b>وضعیت کلی:</b> فعال
🤖 <b>بات:</b> آنلاین
💾 <b>دیتابیس:</b> متصل
🔍 <b>اسکنر TRX:</b> فعال

⏰ <b>آخرین به‌روزرسانی:</b> ${new Date().toLocaleString("fa-IR")}`;

  try {
    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("❌ Error sending system status:", error.message);
  }
};

// سفارشات جدید
const handleNewOrders = async (bot, msg) => {
  const chatId = msg.chat.id;

  const message = `📋 <b>سفارشات جدید</b>

🔍 برای مشاهده سفارشات جدید، از پنل ادمین استفاده کنید.

💡 <b>راهنما:</b>
دستور /panel را در چت خصوصی با بات ارسال کنید.`;

  try {
    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("❌ Error sending new orders message:", error.message);
  }
};

// گزارش مالی (ساده)
const handleFinancialReport = async (bot, msg) => {
  const chatId = msg.chat.id;

  try {
    // جمع شارژهای تایید شده
    const paidCrypto = await CryptoInvoice.find({ status: "paid" });
    const confirmedBank = await invoice.find({
      status: { $in: ["paid", "confirmed"] },
    });
    const cryptoSum = paidCrypto.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const bankSum = confirmedBank.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );
    const totalTopups = cryptoSum + bankSum;

    // مجموع موجودی فعلی کاربران
    const users = await User.find({});
    const totalBalances = users.reduce((sum, u) => sum + (u.balance || 0), 0);

    // درآمد خرج‌شده
    const recognizedRevenue = Math.max(0, totalTopups - totalBalances);

    // تخمین حجم و روز فروخته‌شده برای محاسبه هزینه
    const allPlans = [...plans30, ...plans60, ...plans90]
      .map((p) => ({ price: p.price, gig: p.gig, days: p.days }))
      .sort((a, b) => b.price - a.price);
    let remaining = recognizedRevenue;
    let estGigSold = 0;
    let estDaysSold = 0;
    for (const plan of allPlans) {
      if (plan.price > 0 && remaining >= plan.price) {
        const cnt = Math.floor(remaining / plan.price);
        if (cnt > 0) {
          estGigSold += cnt * (plan.gig || 0);
          estDaysSold += cnt * (plan.days || 0);
          remaining -= cnt * plan.price;
        }
      }
    }

    // هزینه‌ها بر اساس ثابت‌ها
    const costPerDay = Number(process.env.COST_PER_DAY || 200);
    const costPerGb = Number(process.env.COST_PER_GB || 300);
    const totalCost = estDaysSold * costPerDay + estGigSold * costPerGb;
    const profit = recognizedRevenue - totalCost;

    const message =
      `💰 <b>گزارش مالی</b>\n\n` +
      `💵 مجموع شارژهای تایید شده: <code>${totalTopups.toLocaleString()}</code> تومان\n` +
      `👛 مجموع موجودی فعلی کاربران: <code>${totalBalances.toLocaleString()}</code> تومان\n` +
      `📈 سود: <code>${profit.toLocaleString()}</code> تومان`;

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("❌ Error sending financial report:", error.message);
  }
};

// تنظیمات
const handleSettings = async (bot, msg) => {
  const chatId = msg.chat.id;

  const message = `⚙️ <b>تنظیمات سیستم</b>

🔧 <b>تنظیمات موجود:</b>
• فاصله اسکن خودکار: 5 دقیقه
• حالت تست: غیرفعال
• اعلان‌ها: فعال

💡 <b>راهنما:</b>
برای تغییر تنظیمات، از پنل ادمین استفاده کنید.`;

  try {
    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("❌ Error sending settings message:", error.message);
  }
};

// پشتیبانی
const handleSupport = async (bot, msg) => {
  const chatId = msg.chat.id;

  const message = `🆘 <b>پشتیبانی</b>

📞 <b>راه‌های ارتباطی:</b>
• تلگرام: @Swift_servicebot
• ایمیل: support@example.com

🕐 <b>ساعات کاری:</b>
شنبه تا چهارشنبه: 9 صبح تا 6 عصر

💡 <b>برای کمک فوری:</b>
مشکل خود را در این گروه مطرح کنید.`;

  try {
    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("❌ Error sending support message:", error.message);
  }
};

export {
  sendToAdminGroup,
  getGroupKeyboard,
  sendWelcomeMessage,
  handleGroupMessage,
};
