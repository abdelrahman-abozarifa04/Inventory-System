/**
 * alertUtils.js — Expiry Alert Calculation Utility
 *
 * Pure functions for computing the "Notification Trigger Date":
 * the date on which the system should alert staff that a product
 * is approaching its expiry date.
 *
 * Formula:  trigger_date = expiry_date - lead_time
 *
 * Examples:
 *   calculateAlertDate("2025-12-31", 2, "weeks")  → "2025-12-17"
 *   calculateAlertDate("2026-03-01", 1, "months")  → "2026-02-01"
 *   calculateAlertDate("2025-06-15", 10, "days")   → "2025-06-05"
 */

/**
 * Available lead time units with their plural labels (for UI rendering).
 */
export const LEAD_TIME_UNITS = [
  { value: "days",   label: "Days",   label_ar: "أيام"    },
  { value: "weeks",  label: "Weeks",  label_ar: "أسابيع"  },
  { value: "months", label: "Months", label_ar: "أشهر"    },
];

/**
 * Calculate the alert trigger date from an expiry date and lead time.
 *
 * @param {string} expiryDateStr  - ISO date string "YYYY-MM-DD"
 * @param {number} leadValue      - Numeric lead time (e.g., 2)
 * @param {"days"|"weeks"|"months"} leadUnit - Unit of lead time
 * @returns {string|null} - ISO date string "YYYY-MM-DD", or null if inputs are invalid
 */
export const calculateAlertDate = (expiryDateStr, leadValue, leadUnit) => {
  if (!expiryDateStr || !leadValue || leadValue <= 0 || !leadUnit) return null;

  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) return null;

  // Clone to avoid mutating
  const trigger = new Date(expiry);

  switch (leadUnit) {
    case "days":
      trigger.setDate(trigger.getDate() - leadValue);
      break;
    case "weeks":
      trigger.setDate(trigger.getDate() - leadValue * 7);
      break;
    case "months":
      trigger.setMonth(trigger.getMonth() - leadValue);
      break;
    default:
      return null;
  }

  // Return as ISO date string "YYYY-MM-DD"
  return trigger.toISOString().split("T")[0];
};

/**
 * Validate that a trigger date makes logical sense:
 *  - Must be after today (no point alerting in the past)
 *  - Must be before the expiry date
 *
 * @param {string} triggerDateStr  - ISO date "YYYY-MM-DD"
 * @param {string} expiryDateStr   - ISO date "YYYY-MM-DD"
 * @returns {{ valid: boolean, warning: string|null }}
 */
export const validateAlertDate = (triggerDateStr, expiryDateStr) => {
  if (!triggerDateStr || !expiryDateStr) return { valid: true, warning: null };

  const trigger = new Date(triggerDateStr);
  const expiry  = new Date(expiryDateStr);
  const today   = new Date();
  today.setHours(0, 0, 0, 0);

  if (trigger >= expiry) {
    return { valid: false, warning: "Alert date must be before the expiry date." };
  }

  if (trigger < today) {
    return {
      valid: true,
      warning: "⚠ Alert date is in the past — the notification may have already triggered.",
    };
  }

  return { valid: true, warning: null };
};

/**
 * Format a "YYYY-MM-DD" string into a locale-aware display string.
 * @param {string} dateStr
 * @param {boolean} isRTL
 * @returns {string}
 */
export const formatDisplayDate = (dateStr, isRTL = false) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
