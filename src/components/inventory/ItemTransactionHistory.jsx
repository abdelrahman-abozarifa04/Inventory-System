import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineArrowsRightLeft,
  HiOutlineArrowDownRight,
  HiOutlineArrowUpRight,
  HiOutlineFunnel,
  HiOutlineCalendarDays,
  HiOutlineXMark,
} from "react-icons/hi2";
import { AnimatePresence as AP } from "framer-motion";

/**
 * ItemTransactionHistory — Slide-over panel showing all transactions
 * for a single inventory item.
 *
 * Triggered from the Inventory table's "View History" button.
 * Filters the global transactions array client-side by item_id / itemDocId.
 *
 * @param {boolean}   isOpen       - Visibility
 * @param {function}  onClose      - Close callback
 * @param {object}    item         - The inventory item to show history for
 * @param {object[]}  transactions - Full unfiltered transactions array from useTransactions
 */
const ItemTransactionHistory = ({ isOpen, onClose, item, transactions = [] }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir(i18n.language) === "rtl";

  const [filterType, setFilterType] = useState("ALL"); // ALL | IN | OUT

  const itemName = item ? (isRTL ? item.name_ar : item.name_en) : "";
  const itemSerial = item?.serial_number || item?.item_id || item?.id || "";

  // ── Filter transactions for this specific item ──────────────────────────────
  // Matches on item_id (the value stored in the transaction doc).
  // useTransactions stores: item_id = itemData.item_id || itemDocId
  // So we compare against both the custom item_id AND the Firestore doc id.
  const itemHistory = useMemo(() => {
    if (!item) return [];
    return transactions.filter(
      (txn) =>
        txn.item_id === item.item_id ||
        txn.item_id === item.id
    );
  }, [transactions, item]);

  // ── Apply IN/OUT filter ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filterType === "ALL") return itemHistory;
    return itemHistory.filter((txn) => txn.type === filterType);
  }, [itemHistory, filterType]);

  // ── Compute totals ──────────────────────────────────────────────────────────
  const totalIn  = itemHistory.filter((t) => t.type === "IN").reduce((s, t) => s + (t.quantity_changed || 0), 0);
  const totalOut = itemHistory.filter((t) => t.type === "OUT").reduce((s, t) => s + (t.quantity_changed || 0), 0);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────────── */}
      <motion.div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* ── Side Panel ──────────────────────────────────────────────────────── */}
      <motion.aside
        className={`fixed top-0 ${isRTL ? "left-0" : "right-0"} bottom-0 z-[81]
          w-full max-w-xl bg-surface shadow-2xl flex flex-col border-s border-gray-100`}
        initial={{ x: isRTL ? "-100%" : "100%" }}
        animate={{ x: 0 }}
        exit={{ x: isRTL ? "-100%" : "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        {/* ── Panel Header ──────────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-gray-100 bg-gray-50/90 px-7 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Item thumbnail */}
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 bg-white shrink-0 flex items-center justify-center">
                {item?.image_base64 ? (
                  <img src={item.image_base64} alt={itemName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl select-none">📦</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-primary truncate">{itemName}</h3>
                <p className="text-xs font-mono text-text-muted mt-0.5">{itemSerial}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Current stock:{" "}
                  <span className="font-bold text-text">{item?.quantity ?? "—"}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                text-text-muted hover:text-danger hover:bg-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100 shrink-0">
          {[
            { label: "Total Transactions", value: itemHistory.length, color: "text-primary" },
            { label: "Total IN",           value: `+${totalIn}`,      color: "text-success" },
            { label: "Total OUT",          value: `-${totalOut}`,     color: "text-danger"  },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface px-5 py-5 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filter Tabs ───────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-7 py-4">
          <HiOutlineFunnel className="w-3.5 h-3.5 text-text-muted shrink-0" />
          {["ALL", "IN", "OUT"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-all
                ${filterType === type
                  ? type === "IN"  ? "bg-success/15 text-success border border-success/30"
                  : type === "OUT" ? "bg-danger/15 text-danger border border-danger/30"
                  :                  "bg-primary/15 text-primary border border-primary/30"
                  : "bg-surface text-text-muted border border-gray-200 hover:bg-surface-hover"
                }`}
            >
              {type}
            </button>
          ))}
          <span className="ms-auto text-xs text-text-muted">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Transaction List ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full min-h-[240px] text-text-muted gap-3"
              >
                <HiOutlineArrowsRightLeft className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">
                  {itemHistory.length === 0
                    ? "No transaction history for this item yet."
                    : `No ${filterType} transactions found.`}
                </p>
                {itemHistory.length === 0 && (
                  <p className="text-xs text-center max-w-xs text-text-muted/70">
                    Record an IN or OUT transaction from the inventory page to see history here.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {filtered.map((txn, index) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, type: "spring", stiffness: 300, damping: 28 }}
                    className="flex items-center gap-5 border-b border-gray-50 px-7 py-5 transition-colors hover:bg-surface-hover"
                  >
                    {/* Type indicator */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                      ${txn.type === "IN" ? "bg-success/10" : "bg-danger/10"}`}>
                      {txn.type === "IN"
                        ? <HiOutlineArrowDownRight className="w-4 h-4 text-success" />
                        : <HiOutlineArrowUpRight  className="w-4 h-4 text-danger" />
                      }
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase
                          ${txn.type === "IN"
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"}`}>
                          {txn.type}
                        </span>
                        <span className={`text-base font-bold ${txn.type === "IN" ? "text-success" : "text-danger"}`}>
                          {txn.type === "IN" ? "+" : "−"}{txn.quantity_changed}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-text-muted">
                        <HiOutlineCalendarDays className="w-3 h-3 shrink-0" />
                        <span>
                          {new Date(txn.date).toLocaleString(isRTL ? "ar-EG" : "en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* User */}
                    <div className="text-end shrink-0 max-w-[120px]">
                      <p className="text-xs text-text-muted truncate">{txn.user_name}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-gray-100 bg-gray-50/60 px-7 py-5">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold
              text-text-muted hover:bg-gray-100 transition-colors"
          >
            ← Back to Inventory
          </button>
        </div>
      </motion.aside>
    </>,
    document.body
  );
};

export default ItemTransactionHistory;
