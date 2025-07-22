// import { setSession } from "../config/sessionStore.js";

// const handleBankRecipt = async (bot, msg, session) => {
//   const chatId = msg.chat.id;
//   const fileId = msg.photo[msg.photo.length - 1].file_id;
//   const user = msg.from;
//   const groupId = process.env.GROUP_ID;

//   await bot.sendPhoto(groupId, fileId, {
//     caption: `🧾 رسید جدید پرداخت

//     👤 نام کاربر: ${user.first_name || "نامشخص"}
//     🆔 آیدی عددی: ${user.id}
//     📎 یوزرنیم: @${user.username || "ندارد"}
//     💰 مبلغ: ${session.rawAmount} تومان`,
//   });

//   await setSession(chatId, {
//     ...session,
//     step: "recipt_sent",
//   });

//   await bot.sendMessage(
//     chatId,
//     "✅ رسید شما با موفقیت ارسال شد. منتظر تأیید توسط ادمین باشید."
//   );
// };

// export default handleBankRecipt;
