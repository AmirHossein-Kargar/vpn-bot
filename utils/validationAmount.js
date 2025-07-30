const validateWithCommas = (text, min = 10000, max = 500000) => {
  const commaPattern = /^\d{1,3}(,\d{3})*$/;

  if (!commaPattern.test(text)) {
    return {
      valid: false,
      message: "❌ لطفاً مبلغ را با کاما وارد کنید. مثال: <code>50,000</code> یا <code>120,000</code>",
    };
  }

  const amount = parseInt(text.replace(/,/g, ""));

  if (!Number.isInteger(amount) || amount < min || amount > max) {
    return {
      valid: false,
      message: `❌ مبلغ باید بین ${min.toLocaleString()} تا ${max.toLocaleString()} تومان باشد.`,
    };
  }
  console.log(amount);
  return { valid: true, amount };
};

export default validateWithCommas;
