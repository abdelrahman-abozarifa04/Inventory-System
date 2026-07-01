import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Layers,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Bell,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import useBatches from "../../hooks/useBatches";
import { formatDisplayDate, LEAD_TIME_UNITS } from "../../utils/alertUtils";

/**
 * BatchManagementPanel — Slide-over panel to view, add, edit, and delete
 * batches for a selected inventory item.
 *
 * @param {boolean}  isOpen   - Visible state
 * @param {function} onClose  - Toggle callback
 * @param {object}   item     - Parent item object
 */
export const BatchManagementPanel = ({ isOpen, onClose, item }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir(i18n.language) === "rtl";

  const { batches, loading, addBatch, updateBatch, deleteBatch } = useBatches(item?.id);

  // States
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [newBatchData, setNewBatchData] = useState({
    quantity: "",
    production_date: "",
    expiration_date: "",
    alert_lead_value: "2",
    alert_lead_unit: "weeks",
  });

  const itemName = item ? (isRTL ? item.name_ar : item.name_en) : "";
  const itemSerial = item?.serial_number || item?.item_id || item?.id || "";

  // Expiration checking helpers
  const getBatchStatus = (expiryDateStr) => {
    if (!expiryDateStr) {
      return {
        status: "active",
        label: isRTL ? "نشط" : "Active",
        color: "text-success bg-success/10 border-success/20",
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);

    if (expiry < today) {
      return {
        status: "expired",
        label: isRTL ? "منتهي الصلاحية" : "Expired",
        color: "text-danger bg-danger/10 border-danger/20",
      };
    }

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    thirtyDaysLater.setHours(0, 0, 0, 0);

    if (expiry <= thirtyDaysLater) {
      return {
        status: "expiring",
        label: isRTL ? "ينتهي قريباً" : "Expiring Soon",
        color: "text-warning bg-warning/10 border-warning/20",
      };
    }

    return {
      status: "active",
      label: isRTL ? "نشط" : "Active",
      color: "text-success bg-success/10 border-success/20",
    };
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newBatchData.quantity || parseInt(newBatchData.quantity) < 1) return;

    try {
      await addBatch({
        quantity: parseInt(newBatchData.quantity),
        production_date: newBatchData.production_date,
        expiration_date: newBatchData.expiration_date,
        alert_lead_value: parseInt(newBatchData.alert_lead_value),
        alert_lead_unit: newBatchData.alert_lead_unit,
      });

      // Reset
      setNewBatchData({
        quantity: "",
        production_date: "",
        expiration_date: "",
        alert_lead_value: "2",
        alert_lead_unit: "weeks",
      });
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* ── Backdrop Overlay ──────────────────────────────────────────────── */}
      <motion.div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* ── Slide-Over Panel ─────────────────────────────────────────────── */}
      <motion.aside
        className={`fixed top-0 ${isRTL ? "left-0" : "right-0"} bottom-0 z-[81]
          w-full max-w-xl bg-surface shadow-2xl flex flex-col border-s border-gray-100`}
        initial={{ x: isRTL ? "-100%" : "100%" }}
        animate={{ x: 0 }}
        exit={{ x: isRTL ? "-100%" : "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        {/* ── Panel Header ────────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-gray-100 bg-gray-50/90 px-7 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 bg-white shrink-0 flex items-center justify-center">
                {item?.image_base64 ? (
                  <img src={item.image_base64} alt={itemName} className="w-full h-full object-cover" />
                ) : (
                  <Layers className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-primary truncate">
                  {itemName}
                </h3>
                <p className="text-xs font-mono text-text-muted mt-0.5">{itemSerial}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {isRTL ? "المخزون الإجمالي: " : "Total Stock: "}
                  <span className="font-bold text-text">
                    {loading ? "..." : (item?.total_quantity ?? item?.quantity ?? 0)}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                text-text-muted hover:text-danger hover:bg-danger/10 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Action: Add New Batch Toggle ─────────────────────────────────── */}
        <div className="shrink-0 border-b border-gray-100 bg-surface px-7 py-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-5 py-3
              text-sm font-bold text-primary hover:bg-primary/5 transition-colors duration-200 focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? "إضافة دفعة جديدة" : "Add New Batch"}
            </span>
            {showAddForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* ── Inline Add Batch Form ──────────────────────────────────────── */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                onSubmit={handleAddSubmit}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">{isRTL ? "الكمية" : "Quantity"} *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="form-input"
                      value={newBatchData.quantity}
                      onChange={(e) => setNewBatchData({ ...newBatchData, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">{isRTL ? "تاريخ الإنتاج" : "Production Date"}</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newBatchData.production_date}
                      onChange={(e) => setNewBatchData({ ...newBatchData, production_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">{isRTL ? "تاريخ انتهاء الصلاحية" : "Expiration Date"}</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newBatchData.expiration_date}
                      onChange={(e) => setNewBatchData({ ...newBatchData, expiration_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">{isRTL ? "تنبيه قبل (المهلة)" : "Alert Lead Time"}</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        className="form-input w-20"
                        value={newBatchData.alert_lead_value}
                        onChange={(e) => setNewBatchData({ ...newBatchData, alert_lead_value: e.target.value })}
                      />
                      <select
                        className="form-input flex-1"
                        value={newBatchData.alert_lead_unit}
                        onChange={(e) => setNewBatchData({ ...newBatchData, alert_lead_unit: e.target.value })}
                      >
                        {LEAD_TIME_UNITS.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {isRTL ? unit.label_ar : unit.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn btn-secondary py-2 px-4"
                  >
                    {isRTL ? "إلغاء" : "Cancel"}
                  </button>
                  <button type="submit" className="btn btn-primary py-2 px-4">
                    {isRTL ? "إضافة دفعة" : "Add Batch"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* ── Batches List Container ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-text-muted">
              {isRTL ? "جاري تحميل الدفعات..." : "Loading batches..."}
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-text-muted gap-3">
              <Layers className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">
                {isRTL ? "لا توجد دفعات لهذا المنتج حالياً." : "No batches for this item yet."}
              </p>
              <p className="text-xs text-center max-w-xs text-text-muted/70">
                {isRTL
                  ? "قم بإضافة دفعة جديدة باستخدام النموذج أعلاه."
                  : "Add a new batch using the form above."}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {batches.map((b) => {
                const status = getBatchStatus(b.expiration_date);
                const isDeleting = confirmDeleteId === b.id;

                return (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-surface border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 hover:border-gray-200 transition-colors"
                  >
                    {/* Card Header: Batch # and Status Badge */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-text">
                          {isRTL ? "دفعة رقم" : "Batch #"} {b.batch_number?.replace("Batch #", "") || b.batch_number}
                        </h4>
                        <p className="text-[10px] text-text-muted font-mono mt-0.5">ID: {b.id}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Expiry / Prod dates */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-text-muted flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {isRTL ? "تاريخ الإنتاج" : "Prod. Date"}
                        </p>
                        <p className="font-bold mt-1 text-text">
                          {b.production_date ? formatDisplayDate(b.production_date, isRTL) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {isRTL ? "تاريخ الانتهاء" : "Expiry Date"}
                        </p>
                        <p className="font-bold mt-1 text-text">
                          {b.expiration_date ? formatDisplayDate(b.expiration_date, isRTL) : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Alert Trigger Date */}
                    {b.alert_trigger_date && (
                      <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-xs text-text-muted">
                        <Bell className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {isRTL ? "تاريخ تنبيه انتهاء الصلاحية:" : "Expiry alert date:"}{" "}
                          <span className="font-bold text-text">
                            {formatDisplayDate(b.alert_trigger_date, isRTL)}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Controls Row: Qty Adjustment & Delete */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      {/* Qty Adjustment */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted">{isRTL ? "الكمية:" : "Quantity:"}</span>
                        <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateBatch(b.id, { quantity: Math.max(0, b.quantity - 1) })}
                            className="p-2 hover:bg-gray-50 text-text-muted hover:text-danger active:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-12 text-center font-bold text-sm text-text select-none">
                            {b.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateBatch(b.id, { quantity: b.quantity + 1 })}
                            className="p-2 hover:bg-gray-50 text-text-muted hover:text-success active:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Delete Flow */}
                      <div>
                        {isDeleting ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-danger font-bold uppercase tracking-wider">
                              {isRTL ? "تأكيد؟" : "Confirm?"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteBatch(b.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-semibold hover:bg-danger-hover transition-colors"
                            >
                              {isRTL ? "نعم" : "Yes"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-text-muted text-xs font-semibold hover:bg-gray-50 transition-colors"
                            >
                              {isRTL ? "لا" : "No"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(b.id)}
                            className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                            title={isRTL ? "حذف الدفعة" : "Delete Batch"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-gray-100 bg-gray-50/60 px-7 py-5">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold
              text-text-muted hover:bg-gray-100 transition-colors"
          >
            {isRTL ? "← العودة إلى المخزون" : "← Back to Inventory"}
          </button>
        </div>
      </motion.aside>
    </>,
    document.body
  );
};

export default BatchManagementPanel;
