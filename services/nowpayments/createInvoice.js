import axios from "axios";

const createNowPaymentsInvoice = async (params) => {
  const API_KEY = process.env.NOW_PAYMENTS_API_KEY;

  const payload = {
    price_amount: Number(params.amountUsd.toFixed(2)),
    price_currency: "USD",
    pay_currency: params.payCurrency,
    order_id: params.orderId,
    order_description: params.description,
  };

  const headers = {
    "x-api-key": API_KEY,
    "content-type": "application/json",
  };

  const { data } = await axios.post(
    "https://api.nowpayments.io/v1/invoice",
    payload,
    { headers }
  );
  return data;
};

export default createNowPaymentsInvoice;
