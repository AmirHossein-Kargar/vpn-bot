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
  return `
   <b>شناسه سرویس:</b> <code>${username}</code>
  👤 <b>حداکثر اتصال:</b> <code>${maxUser} کاربر</code>
  📥 <b>حجم مجاز:</b> <code>${maxUsageMB} گیگابایت</code>
  🔗 <b>لینک هوشمند (همه لوکیشن‌ها):</b>
  <code>${smartLink}</code>
  
  🔗 <b>لینک تکی لوکیشن پیشنهادی:</b>
  <code>${singleLink}</code>
  
  📌 برای کپی لینک، روی آن لمس طولانی کنید یا راست‌کلیک کنید.
  
  ⚠️ این سرویس از نوع <b>Subscription</b> است. جهت اتصال، لطفاً راهنمای استفاده را بررسی کنید.`;
}

export { guideButtons } from "../handlers/message/handleGuide.js";

export function getSuccessServiceMessage({ username, smartLink, singleLink }) {
  return `✅ <b>سرویس شما با موفقیت ساخته شد.</b>

 <b>آیدی سرویس:</b> <code>${username}</code>

🔗 <b>لینک اتصال (Subscription):</b>
<code>${smartLink}</code>

👈 <b>لینک تکی از لوکیشن پیشنهادی:</b>
<code>${singleLink}</code>

📌 برای کپی لینک، روی آن لمس طولانی کنید یا راست‌ کلیک کنید.

⚠️ این سرویس از نوع <b>Subscription</b> است. برای اتصال، از راهنمای زیر استفاده کنید.`;
}
