const sessions = require("./sessions")
// const handleTopUp = require("./handleTopUp")

async function showPaymentStep(bot, chatId, messageId, {stepKey, message}) {
    await bot.deleteMessage(chatId, messageId)

    sessions[chatId] = {step: stepKey}

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
               [{ text: "🔙 بازگشت به روش‌های پرداخت", callback_data: "back_to_topup" }]
            ]
        }
    }) 
}


module.exports = showPaymentStep;