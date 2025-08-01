function normalizeServiceData(apiResult = {}, plan = {}) {
  return {
    username: apiResult.username || "",
    sub_link: apiResult.sub_link || "",
    created_at: apiResult.created_at
      ? new Date(apiResult.created_at * 1000)
      : new Date(),
    expire_date:
      apiResult.expire_date ||
      (apiResult.expiryTime
        ? new Date(apiResult.expiryTime * 1000).toISOString().split("T")[0]
        : ""),
    expiration_time: apiResult.expiryTime || 0,
    usage: apiResult.usage || 0,
    gig: apiResult.gig || plan.gig || 0,
    day: apiResult.day || plan.day || 0,
    uid: apiResult.uid || "",
    status: apiResult.status || "manual",
  };
}

export default normalizeServiceData;
