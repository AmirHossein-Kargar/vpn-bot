const axios = require("axios");

async function createNowPaymentsInvoice({amountUsd, payCurrency, orderId, description = "Top-up"}) {
    const API_KEY = process.env.NOW_PAYMENTS_API_KEY;

    const payload = {
        price_amount: Number(amountUsd.toFixed(2)),
        price_currency: "USD",
        pay_currency: payCurrency,
        order_id: orderId,
        order_description: description,
    }

    const headers = {
        "x-api-key": API_KEY,
        "content-type": "application/json",
    }
    
    const {data} = await axios.post("https://api.nowpayments.io/v1/invoice", payload, {headers});
    return data
}

module.exports = createNowPaymentsInvoice;