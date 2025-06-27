const { getSession } = require("../sessionStore")
const handleTonAmount = require("../paymentHandlers/handleTonAmount")

module.exports = async function handleMessage(bot, msg) {
    const chatId = msg.chat.id
    const session = await getSession(chatId)

    if(session?.step === "waiting_for_ton_amount") {
        return handleTonAmount(bot, msg)
    }
}