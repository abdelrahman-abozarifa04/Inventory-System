import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineQrCode,
  HiOutlineCube,
  HiOutlineArrowDownRight,
  HiOutlineCheckCircle,
  HiMinus,
  HiPlus,
  HiOutlineArrowLeft
} from "react-icons/hi2";
import { Layers, PlusCircle } from "lucide-react";
import Modal from "../ui/Modal";
import useBatches from "../../hooks/useBatches";
import { formatDisplayDate, LEAD_TIME_UNITS } from "../../utils/alertUtils";

/**
 * RestockModal — Smart Inbound / Restock Confirmation Dialog
 *
 * Triggered when a barcode scan matches an existing inventory item.
 * Supports a 3-step batch routing flow:
 *   1. "choose" - Select an existing batch or "+ Create New Batch"
 *   2. "add_to" - Quantity input for the selected existing batch
 *   3. "new_batch" - Quantity, dates & alert preferences for a new batch
 *
 * Props:
 *  isOpen          {boolean}   - Visibility toggle
 *  onClose         {function}  - Called after cancel or successful restock
 *  item            {object}    - The matched inventory item (from parent)
 *  onConfirm       {function}  - async (item, qty, batchInfo) => void — executes Firestore writes
 */
const RestockModal = ({ isOpen, onClose, item, onConfirm }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir(i18n.language) === "rtl";

  const { batches, loading: loadingBatches } = useBatches(isOpen ? item?.id : null);

  // Flow State: "choose" | "add_to" | "new_batch" | "done"
  const [step, setStep] = useState("choose");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);
  const inputRef = useRef(null);

  // New batch metadata inputs
  const [newBatchFields, setNewBatchFields] = useState({
    production_date: "",
    expiration_date: "",
    alert_lead_value: "2",
    alert_lead_unit: "weeks",
  });

  // Reset state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("choose");
      setSelectedBatch(null);
      setQuantity(1);
      setNewBatchFields({
        production_date: "",
        expiration_date: "",
        alert_lead_value: "2",
        alert_lead_unit: "weeks",
      });
      setError("");
      setLoading(false);
      setIsDone(false);
    }
  }, [isOpen, item]);

  // Autofocus input when step changes
  useEffect(() => {
    if (step === "add_to" || step === "new_batch") {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [step]);

  if (!item) return null;

  const itemName = isRTL ? item.name_ar : item.name_en;
  const currentTotalQty = parseInt(item.total_quantity ?? item.quantity) || 0;
  const projectedTotalQty = currentTotalQty + Math.max(0, parseInt(quantity) || 0);

  const handleQuantityChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setQuantity("");
      return;
    }
    const n = parseInt(val);
    if (!isNaN(n) && n >= 1) setQuantity(n);
  };

  const increment = () => setQuantity((prev) => (parseInt(prev) || 0) + 1);
  const decrement = () => setQuantity((prev) => Math.max(1, (parseInt(prev) || 1) - 1));

  const handleConfirm = async () => {
    const qty = parseInt(quantity);
    if (!qty || qty < 1) {
      setError(t("restock.error_qty", "Please enter a valid quantity (minimum 1)."));
      return;
    }

    setLoading(true);
    setError("");

    try {
      let batchInfo = null;

      if (step === "add_to" && selectedBatch) {
        batchInfo = {
          type: "existing",
          batchId: selectedBatch.id,
        };
      } else if (step === "new_batch") {
        batchInfo = {
          type: "new",
          batchData: {
            production_date: newBatchFields.production_date,
            expiration_date: newBatchFields.expiration_date,
            alert_lead_value: parseInt(newBatchFields.alert_lead_value),
            alert_lead_unit: newBatchFields.alert_lead_unit,
          },
        };
      }

      await onConfirm(item, qty, batchInfo);
      setIsDone(true);
      setStep("done");

      // Auto-close after success flash
      setTimeout(() => {
        setIsDone(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error("[RestockModal] Confirm failed:", err);
      setError(err.message || t("errors.save_failed", "Failed to restock. Please try again."));
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={t("restock.modal_title", "Item Recognised — Restock")}
      maxWidth="max-w-md"
    >
      <AnimatePresence mode="wait">
        {step === "done" && isDone ? (
          /* ── Step: Success ───────────────────────────────────────── */
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-4 py-10"
          >
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <HiOutlineCheckCircle className="w-9 h-9 text-success" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-success">
                {t("restock.success_title", "Stock Updated!")}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {t("restock.success_desc", "New stock: {{qty}}", { qty: projectedTotalQty })}
              </p>
            </div>
          </motion.div>
        ) : step === "choose" ? (
          /* ── Step 0: Choose Batch ─────────────────────────────────── */
          <motion.div
            key="choose"
            initial={{ opacity: 0, x: isRTL ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 15 : -15 }}
            className="flex flex-col gap-6"
          >
            {/* Scan match info */}
            <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
              <HiOutlineQrCode className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs font-medium text-primary">
                {t("restock.scan_match", "Barcode matched an existing item in your inventory.")}
              </p>
            </div>

            {/* Item info header */}
            <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-surface-hover p-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0 shadow-soft">
                <HiOutlineCube className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-text truncate">{itemName}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {t("inventory.modals.serial", "Serial")}:{" "}
                  <span className="font-mono text-text">{item.serial_number || item.item_id || item.id}</span>
                </p>
              </div>
            </div>

            {/* Sub-header */}
            <div>
              <h4 className="font-bold text-sm text-text">
                {isRTL ? "اختر الدفعة المراد زيادة مخزونها" : "Choose batch to restock"}
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                {isRTL
                  ? "اختر دفعة حالية أو أنشئ دفعة جديدة لتتبع تاريخ صلاحية مختلف."
                  : "Select an existing batch or create a new batch with a custom expiry."}
              </p>
            </div>

            {/* Batch Lists */}
            <div className="max-h-60 overflow-y-auto pr-1 space-y-3">
              {loadingBatches ? (
                <div className="flex items-center justify-center py-6 text-xs text-text-muted">
                  {isRTL ? "جاري تحميل الدفعات..." : "Loading batches..."}
                </div>
              ) : (
                <>
                  {batches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBatch(b);
                        setStep("add_to");
                      }}
                      className="w-full text-start flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:border-primary hover:bg-primary/5 transition-all focus:outline-none"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-text flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                          {isRTL ? "دفعة رقم" : "Batch #"} {b.batch_number?.replace("Batch #", "") || b.batch_number}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {b.expiration_date
                            ? `${isRTL ? "ينتهي:" : "Expires:"} ${formatDisplayDate(b.expiration_date, isRTL)}`
                            : isRTL ? "لا يوجد تاريخ انتهاء" : "No Expiry"}
                        </p>
                      </div>
                      <span className="font-bold text-sm text-text-muted tabular-nums bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 shrink-0">
                        {b.quantity} {isRTL ? "وحدة" : "units"}
                      </span>
                    </button>
                  ))}

                  {/* Create New Batch Card */}
                  <button
                    type="button"
                    onClick={() => setStep("new_batch")}
                    className="w-full text-start flex items-center gap-3 rounded-xl border border-dashed border-gray-300 p-4 hover:border-primary hover:bg-primary/5 transition-all focus:outline-none"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-text-muted shrink-0">
                      <PlusCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-primary">
                        {isRTL ? "إنشاء دفعة جديدة" : "Create New Batch"}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {isRTL
                          ? "أدخل كمية وتاريخ صلاحية لدفعة شراء جديدة."
                          : "Enter quantity and custom expiry for a new purchase batch."}
                      </p>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Cancel Button */}
            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-text-muted hover:bg-gray-100 rounded-xl transition-colors"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </motion.div>
        ) : step === "add_to" ? (
          /* ── Step 1a: Add to Existing Batch ──────────────────────── */
          <motion.div
            key="add_to"
            initial={{ opacity: 0, x: isRTL ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 15 : -15 }}
            className="flex flex-col gap-6"
          >
            {/* Back button */}
            <button
              onClick={() => setStep("choose")}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus:outline-none self-start"
            >
              <HiOutlineArrowLeft className="w-3.5 h-3.5" />
              {isRTL ? "الرجوع لاختيار الدفعة" : "Back to Batch Selection"}
            </button>

            {/* Batch Info Header */}
            <div className="rounded-2xl border border-gray-100 bg-surface-hover p-4 space-y-2">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">
                {isRTL ? "الدفعة المحددة" : "Selected Batch"}
              </p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-text">
                  {isRTL ? "دفعة رقم" : "Batch #"} {selectedBatch.batch_number?.replace("Batch #", "") || selectedBatch.batch_number}
                </span>
                <span className="text-xs font-semibold text-text-muted">
                  {selectedBatch.expiration_date
                    ? formatDisplayDate(selectedBatch.expiration_date, isRTL)
                    : isRTL ? "لا يوجد تاريخ انتهاء" : "No Expiry"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-text-muted pt-1 border-t border-gray-100">
                <span>{isRTL ? "مخزون الدفعة الحالي:" : "Current batch stock:"}</span>
                <span className="font-bold text-text">{selectedBatch.quantity}</span>
              </div>
            </div>

            {/* Quantity adjustment */}
            <div>
              <label className="form-label">
                {t("restock.qty_label", "Quantity to Add")} *
              </label>

              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={decrement}
                  disabled={loading || (parseInt(quantity) || 0) <= 1}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center
                    hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 shrink-0"
                >
                  <HiMinus className="w-4 h-4 text-text-muted" />
                </button>

                <input
                  ref={inputRef}
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  onBlur={() => { if (!quantity || parseInt(quantity) < 1) setQuantity(1); }}
                  disabled={loading}
                  className="form-input text-center text-lg font-bold tabular-nums flex-1"
                />

                <button
                  type="button"
                  onClick={increment}
                  disabled={loading}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center
                    hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 shrink-0"
                >
                  <HiPlus className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {/* Presets */}
              <div className="mt-3 flex flex-wrap gap-2.5">
                {[5, 10, 20, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={loading}
                    onClick={() => setQuantity(preset)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all
                      ${parseInt(quantity) === preset
                        ? "bg-primary text-white border-primary shadow-soft"
                        : "border-gray-200 text-text-muted hover:border-primary hover:text-primary"
                      }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Projected total preview */}
            <div className="flex items-center justify-between rounded-xl border border-success/20 bg-success/5 px-5 py-4">
              <span className="text-sm font-semibold text-text-muted">
                {isRTL ? "مخزون المنتج الإجمالي الجديد:" : "New Total Product Stock:"}
              </span>
              <div className="flex items-center gap-1.5">
                <HiOutlineArrowDownRight className="w-4 h-4 text-success" />
                <span className="text-xl font-bold text-success tabular-nums">{projectedTotalQty}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => setStep("choose")}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-semibold text-text-muted hover:bg-gray-100 rounded-xl transition-colors"
              >
                {isRTL ? "السابق" : "Back"}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || !quantity || parseInt(quantity) < 1}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-success hover:bg-success/90 rounded-xl shadow-soft transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
              >
                {loading ? (
                  <>
                    <span className="spinner animate-spin" style={{ width: 14, height: 14 }} />
                    {t("common.saving", "Saving...")}
                  </>
                ) : (
                  <>
                    <HiOutlineArrowDownRight className="w-4 h-4" />
                    {isRTL ? "تأكيد التوريد" : "Confirm Restock"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── Step 1b: Create & Restock into New Batch ────────────── */
          <motion.div
            key="new_batch"
            initial={{ opacity: 0, x: isRTL ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 15 : -15 }}
            className="flex flex-col gap-5"
          >
            {/* Back button */}
            <button
              onClick={() => setStep("choose")}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus:outline-none self-start"
            >
              <HiOutlineArrowLeft className="w-3.5 h-3.5" />
              {isRTL ? "الرجوع لاختيار الدفعة" : "Back to Batch Selection"}
            </button>

            {/* Qty Section */}
            <div>
              <label className="form-label">
                {t("restock.qty_label", "Quantity to Add")} *
              </label>

              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={decrement}
                  disabled={loading || (parseInt(quantity) || 0) <= 1}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center
                    hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 shrink-0"
                >
                  <HiMinus className="w-4 h-4 text-text-muted" />
                </button>

                <input
                  ref={inputRef}
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  onBlur={() => { if (!quantity || parseInt(quantity) < 1) setQuantity(1); }}
                  disabled={loading}
                  className="form-input text-center text-lg font-bold tabular-nums flex-1"
                />

                <button
                  type="button"
                  onClick={increment}
                  disabled={loading}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center
                    hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 shrink-0"
                >
                  <HiPlus className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>

            {/* Expiry Dates form fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{isRTL ? "تاريخ الإنتاج" : "Production Date"}</label>
                <input
                  type="date"
                  className="form-input"
                  value={newBatchFields.production_date}
                  onChange={(e) => setNewBatchFields({ ...newBatchFields, production_date: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">{isRTL ? "تاريخ الانتهاء" : "Expiration Date"}</label>
                <input
                  type="date"
                  className="form-input"
                  value={newBatchFields.expiration_date}
                  onChange={(e) => setNewBatchFields({ ...newBatchFields, expiration_date: e.target.value })}
                />
              </div>
            </div>

            {/* Alert Preferences */}
            <div>
              <label className="form-label">{isRTL ? "تنبيه قبل انتهاء الصلاحية بـ" : "Alert Lead Time"}</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  min="1"
                  className="form-input w-20"
                  value={newBatchFields.alert_lead_value}
                  onChange={(e) => setNewBatchFields({ ...newBatchFields, alert_lead_value: e.target.value })}
                />
                <select
                  className="form-input flex-1"
                  value={newBatchFields.alert_lead_unit}
                  onChange={(e) => setNewBatchFields({ ...newBatchFields, alert_lead_unit: e.target.value })}
                >
                  {LEAD_TIME_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {isRTL ? unit.label_ar : unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Projected total preview */}
            <div className="flex items-center justify-between rounded-xl border border-success/20 bg-success/5 px-5 py-4">
              <span className="text-sm font-semibold text-text-muted">
                {isRTL ? "مخزون المنتج الإجمالي الجديد:" : "New Total Product Stock:"}
              </span>
              <div className="flex items-center gap-1.5">
                <HiOutlineArrowDownRight className="w-4 h-4 text-success" />
                <span className="text-xl font-bold text-success tabular-nums">{projectedTotalQty}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => setStep("choose")}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-semibold text-text-muted hover:bg-gray-100 rounded-xl transition-colors"
              >
                {isRTL ? "السابق" : "Back"}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || !quantity || parseInt(quantity) < 1}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-success hover:bg-success/90 rounded-xl shadow-soft transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
              >
                {loading ? (
                  <>
                    <span className="spinner animate-spin" style={{ width: 14, height: 14 }} />
                    {t("common.saving", "Saving...")}
                  </>
                ) : (
                  <>
                    <HiOutlineArrowDownRight className="w-4 h-4" />
                    {isRTL ? "إنشاء وتوريد" : "Create & Restock"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default RestockModal;
