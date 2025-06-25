const sessions = require("../sessions")
const handleTonAmount = require("../paymentHandlers/handleTonAmount")

module.exports = async function handleMessage(bot, msg) {
    const chatId = msg.chat.id
    const session = sessions[chatId]

    if(session?.step === "waiting_for_ton_amount") {
        return handleTonAmount(bot, msg)
    }
}