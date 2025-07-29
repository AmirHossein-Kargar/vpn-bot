import moment from "moment-jalaali";

function formatDate(date) {
  return moment(date).format("jYYYY/jM/jD");
}

export default formatDate;
