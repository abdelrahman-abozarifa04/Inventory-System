import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineArrowDownTray, HiOutlineArrowUpTray } from "react-icons/hi2";
import Modal from "../ui/Modal";
import useTransactions from "../../hooks/useTransactions";

/**
 * TransactionModal — Record Stock IN / OUT
 *
 * Phase 4 — QA Hardening:
 * - Strict quantity validation (positive integer only, no NaN, no float tricks)
 * - Overflow guard (cannot dispatch more than stock)
 * - Inline error display (no alert())
 * - Double-submit prevention via `loading` state
 * - Loading spinner on submit button
 * - All hooks called unconditionally (React rules compliance)
 *
 * @param {boolean}  isOpen   - Modal visibility
 * @param {function} onClose  - Close callback
 * @param {object}   item     - Target inventory item (required to render content)
 */
const TransactionModal = ({ isOpen, onClose, item }) => {
  const { t, i18n } = useTranslation();
  const { recordTransaction } = useTransactions();

  const [type, setType] = useState("OUT");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRTL = i18n.dir(i18n.language) === "rtl";

  // Reset form state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setType("OUT");
      setQty("");
      setError("");
    }
  }, [isOpen]);

  /** Strict quantity sanitizer — ensures a valid positive integer */
  const parseQty = (raw) => {
    const trimmed = String(raw).trim();
    // Reject if contains non-digit chars (decimals, letters, etc.)
    if (!/^\d+$/.test(trimmed)) return NaN;
    return parseInt(trimmed, 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double-submit

    const parsedQty = parseQty(qty);

    // Validate quantity
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError(
        t("validation.positive_integer") ||
          "Please enter a valid positive whole number."
      );
      return;
    }

    // Prevent over-dispatch
    if (type === "OUT" && parsedQty > Number(item?.quantity)) {
      setError(
        t("validation.exceeds_stock", { stock: item?.quantity }) ||
          `Cannot dispatch more than current stock (${item?.quantity}).`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await recordTransaction({
        itemDocId: item.id,
        type,
        quantity_changed: parsedQty,
      });
      setLoading(false);
      onClose();
    } catch (err) {
      console.error("[TransactionModal] Error:", err);
      setError(
        t("errors.transaction_failed") ||
          "Transaction failed. Please check your connection and try again."
      );
      setLoading(false);
    }
  };

  // Guard: all hooks above this line, return null after
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("inventory.modals.transaction_title")}
      maxWidth="max-w-md"
    >
      {/* Item Summary Bar */}
      <div className="mb-8 rounded-2xl border border-primary/10 bg-primary/5 p-6">
        <h4 className="font-bold text-primary text-sm">
          {isRTL ? item.name_ar : item.name_en}
        </h4>
        <div className="flex items-center gap-3 mt-1.5">
          <p className="text-xs text-text-muted">
            {t("transactions.current_stock") || "Current stock:"}{" "}
            <span className="font-bold text-text text-sm">{item.quantity}</span>
          </p>
          {item.minimum_threshold && item.quantity <= item.minimum_threshold && (
            <span className="text-[10px] font-bold uppercase tracking-wider
              text-danger bg-danger/10 px-2 py-0.5 rounded-full border border-danger/20">
              {t("inventory.low_stock")}
            </span>
          )}
        </div>
      </div>

      {/* Inline Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20
          text-danger text-sm flex items-start gap-2">
          <span className="shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate>

        {/* Type Selector */}
        <div className="flex gap-3">
          <button
            type="button"
            id="type-in-btn"
            onClick={() => { setType("IN"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-5
              border-2 font-semibold text-sm transition-all active:scale-95
              ${type === "IN"
                ? "bg-success/12 border-success text-success shadow-sm"
                : "bg-surface border-gray-200 text-text-muted hover:border-gray-300"
              }`}
          >
            <HiOutlineArrowDownTray className="w-5 h-5 shrink-0" />
            {t("inventory.modals.type_in")}
          </button>

          <button
            type="button"
            id="type-out-btn"
            onClick={() => { setType("OUT"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-5
              border-2 font-semibold text-sm transition-all active:scale-95
              ${type === "OUT"
                ? "bg-danger/12 border-danger text-danger shadow-sm"
                : "bg-surface border-gray-200 text-text-muted hover:border-gray-300"
              }`}
          >
            <HiOutlineArrowUpTray className="w-5 h-5 shrink-0" />
            {t("inventory.modals.type_out")}
          </button>
        </div>

        {/* Quantity */}
        <div>
          <label className="form-label">
            {t("inventory.modals.qty_to_change")} *
          </label>
          <input
            id="transaction-qty-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={qty}
            onChange={(e) => {
              // Only allow digits
              const sanitized = e.target.value.replace(/[^0-9]/g, "");
              setQty(sanitized);
              if (error) setError("");
            }}
            required
            placeholder="0"
            className="form-input text-xl font-bold tracking-wide"
            autoFocus
          />
          <p className="mt-2.5 text-xs text-text-muted">
            {type === "OUT"
              ? (t("validation.max_stock_hint", { max: item.quantity }) || `Maximum: ${item.quantity}`)
              : (t("validation.qty_hint") || "Enter the quantity to add to stock")}
          </p>
        </div>

        {/* Stock Preview */}
        {qty && !isNaN(parseQty(qty)) && parseQty(qty) > 0 && (
          <div className="mt-1 flex items-center justify-between rounded-xl border border-gray-100 bg-surface p-4">
            <span className="text-xs text-text-muted font-medium">
              {t("transactions.preview") || "New stock level"}
            </span>
            <span className={`text-base font-bold
              ${type === "OUT"
                ? (item.quantity - parseQty(qty)) < 0 ? "text-danger" : "text-text"
                : "text-success"
              }`}>
              {type === "IN"
                ? item.quantity + parseQty(qty)
                : Math.max(0, item.quantity - parseQty(qty))}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 border-t border-gray-100 pt-8">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-sm font-semibold text-text-muted
              hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 text-sm font-semibold text-white rounded-xl
              shadow-soft transition-all active:scale-95
              disabled:opacity-60 disabled:cursor-not-allowed
              min-w-[130px] flex items-center justify-center gap-2
              ${type === "IN"
                ? "bg-success hover:bg-success/90"
                : "bg-primary hover:bg-primary-dark"
              }`}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                {t("common.saving") || "Saving..."}
              </>
            ) : (
              <>
                {type === "IN"
                  ? <HiOutlineArrowDownTray className="w-4 h-4 shrink-0" />
                  : <HiOutlineArrowUpTray className="w-4 h-4 shrink-0" />
                }
                {t("common.save")}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionModal;
