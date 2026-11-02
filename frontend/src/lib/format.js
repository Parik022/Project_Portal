// Display helpers shared across pages.

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    : "—";

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "—";

export const weekday = (value) =>
  new Date(value).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });

export const timeAgo = (value) => {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export const ROLE_LABELS = { STUDENT: "Student", FACULTY: "Faculty", HOD: "HOD", ADMIN: "Admin" };

// status -> [badge variant, human label]
const STATUS = {
  PENDING: ["warning", "Pending"],
  VERIFIED: ["success", "Verified"],
  REJECTED: ["danger", "Rejected"],
  APPROVED: ["success", "Approved"],
  CHANGES_REQUESTED: ["danger", "Changes requested"],
  REMOTE: ["default", "Remote"],
  ONSITE: ["muted", "On-site"],
};

export const statusVariant = (status) => STATUS[status]?.[0] ?? "muted";
export const statusLabel = (status) => STATUS[status]?.[1] ?? status;
