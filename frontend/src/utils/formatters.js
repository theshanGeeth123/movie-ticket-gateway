export const money = (value, currency = "LKR") => {
  const number = Number(value || 0);
  return `${currency} ${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export const dateOnly = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
};

export const dateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export const showTimeLabel = (showtime) => {
  if (!showtime) return "-";
  return `${dateOnly(showtime.showDate)} · ${showtime.startTime || ""} - ${showtime.endTime || ""}`;
};

export const getId = (item) => item?._id || item?.id || item;

export const imageUrl = (movie) => movie?.mainImage?.url || movie?.poster || movie?.image || "";

export const getErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

export const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const roleHome = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "staff") return "/staff/dashboard";
  return "/customer/dashboard";
};
