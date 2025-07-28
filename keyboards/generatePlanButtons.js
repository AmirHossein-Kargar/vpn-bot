const generatePlanButtons = (plans) => {
    const buttons = plans.map((plan) => [
      {
        text: `${plan.name} | ${plan.price.toLocaleString("en-US")} تومان`,
        callback_data: `plan_${plan.id}`,
      },
    ]);
  
    // * Add the "بازگشت" (Back) button at the end
    buttons.push([
      {
        text: "🔙 بازگشت",
        callback_data: "buy_service_back",
      },
    ]);
  
    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  };

  export default generatePlanButtons;