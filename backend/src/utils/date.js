// All attendance dates are calendar days in India Standard Time, stored as
// DATE columns (midnight UTC in JavaScript). These helpers keep that consistent.

const TIME_ZONE = "Asia/Kolkata";

const ymdInIST = (instant = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);

const toDateOnly = (ymd) => new Date(`${ymd}T00:00:00.000Z`);

const todayIST = () => toDateOnly(ymdInIST());

const formatYmd = (date) => date.toISOString().slice(0, 10);

const isWeekend = (date) => {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

// Monday–Friday days from start to end, both inclusive. Returns 0 if end < start.
const countWorkingDays = (start, end) => {
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (!isWeekend(cursor)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
};

module.exports = { ymdInIST, toDateOnly, todayIST, formatYmd, isWeekend, countWorkingDays };
