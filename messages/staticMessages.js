export const WELCOME_MESSAGE = `🤖 به ربات سویفت خوش آمدید...

🚀 سویفت سرویسی از نوع شتاب دهنده اینترنت شما با لوکیشن‌های مختلف

📱 امکان اتصال در اندروید، ویندوز، آیفون و...

🌐 قابل استفاده بر روی تمام اینترنت‌ها

🔻 از این پایین یک گزینه رو انتخاب کن.️️`;

export const CHOOSE_OPTION_MESSAGE = `🔻لطفا یکی از گزینه های موجود را انتخاب کنید :`;

export function getTestServiceMessage({
    maxUser,
    maxUsageMB,
    smartLink,
    singleLink,
    username,
  }) {
    return `🎉 <b>سرویس تست یک‌ روزه شما فعال شد!</b>
  
  🆔 <b>شناسه سرویس:</b> <code>${username}</code>
  👤 <b>حداکثر اتصال:</b> ${maxUser} کاربر
  📥 <b>حجم مجاز:</b> ${maxUsageMB} گیگابایت
  
  🔗 <b>لینک هوشمند (همه لوکیشن‌ها):</b>
  <code>${smartLink}</code>
  
  🔗 <b>لینک تکی لوکیشن پیشنهادی:</b>
  <code>${singleLink}</code>
  
  📌 برای کپی لینک، روی آن لمس طولانی کنید یا راست‌کلیک کنید.
  
  ⚠️ این سرویس از نوع <b>Subscription</b> است. جهت اتصال، لطفاً راهنمای استفاده را بررسی کنید.`;
  }
  

export { guideButtons } from "../handlers/message/handleGuide.js";
