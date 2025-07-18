import axios from "axios";

const getNowPaymentsEstimate = async ({
  amount,
  currency_from = "USD",
  currency_to,
}) => {
  if (!amount || !currency_to || !currency_from) {
    throw new Error("Amount, currency_from, and currency_to are required!");
  }

  const API_KEY = process.env.NOW_PAYMENTS_API_KEY;
  const URL = `https://api.nowpayments.io/v1/estimate?amount=${amount}&currency_from=${currency_from}&currency_to=${currency_to}`;

  const headers = { "x-api-key": API_KEY };

  const { data } = await axios.get(URL, { headers });

  if (!data?.estimated_amount) {
    throw new Error("Failed to get estimated amount from NowPayments API");
  }

  return data.estimated_amount;
};

export default getNowPaymentsEstimate;
