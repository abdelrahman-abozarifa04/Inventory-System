import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineExclamationTriangle, HiOutlineTrash } from "react-icons/hi2";
import Modal from "../ui/Modal";

/**
 * DeleteConfirmModal — Safety gate before permanent item deletion.
 *
 * Renders a two-step confirmation dialog:
 *   Step 1 — Warns the user with the product name and consequences.
 *   Step 2 — Requires typing "DELETE" so accidental clicks are impossible.
 *
 * @param {boolean}   isOpen    - Visibility
 * @param {function}  onClose   - Cancel callback
 * @param {object}    item      - The inventory item being deleted
 * @param {function}  onConfirm - Async function called on confirmed deletion
 */
const DeleteConfirmModal = ({ isOpen, onClose, item, onConfirm }) => {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const itemName = item?.name_en || item?.name_ar || "this item";
  const isConfirmed = confirmText.trim().toUpperCase() === "DELETE";

  const handleClose = () => {
    if (loading) return;
    setConfirmText("");
    setError("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!isConfirmed || loading) return;
    setLoading(true);
    setError("");
    try {
      await onConfirm(item.id);
      setConfirmText("");
      onClose();
    } catch (err) {
      console.error("[DeleteConfirmModal] deletion failed:", err);
      setError("Failed to delete item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal opens/closes
  if (!isOpen && confirmText) {
    setConfirmText("");
    setError("");
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Permanent Delete"
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold
              text-text-muted hover:bg-gray-100 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed || loading}
            className={`flex-1 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all
              flex items-center justify-center gap-2
              ${isConfirmed && !loading
                ? "bg-danger hover:bg-danger/90 shadow-sm active:scale-95"
                : "bg-danger/30 cursor-not-allowed"
              } disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <HiOutlineTrash className="w-4 h-4" />
                Permanently Delete
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-8">

        {/* ── Warning Icon + Message ────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="w-20 h-20 rounded-full bg-danger/10 border-2 border-danger/20
            flex items-center justify-center">
            <HiOutlineExclamationTriangle className="w-10 h-10 text-danger" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-text">Are you absolutely sure?</h4>
            <p className="text-sm text-text-muted mt-1 leading-relaxed">
              You are about to permanently delete{" "}
              <span className="font-semibold text-danger">"{itemName}"</span>.
              <br />
              This will remove the product and all its associated data.{" "}
              <strong className="text-text">This action cannot be undone.</strong>
            </p>
          </div>
        </div>

        {/* ── Affected Info Card ────────────────────────────────────────── */}
        {item && (
          <div className="flex items-center gap-4 rounded-xl border border-danger/15 bg-danger/5 px-5 py-4">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-100 bg-white shrink-0 flex items-center justify-center">
              {item.image_base64 ? (
                <img src={item.image_base64} alt={itemName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base select-none">📦</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text truncate">{itemName}</p>
              <p className="text-xs font-mono text-text-muted truncate">
                {item.serial_number || item.item_id || item.id}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Current stock: <span className="font-semibold text-text">{item.quantity}</span> units
              </p>
            </div>
          </div>
        )}

        {/* ── Type-to-confirm Input ─────────────────────────────────────── */}
        <div>
          <label className="mb-3 block text-sm font-semibold uppercase tracking-wider text-text-muted">
            Type <span className="text-danger font-bold">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
            placeholder="DELETE"
            className={`w-full rounded-xl border px-5 py-3.5 font-mono text-base font-semibold tracking-widest
              bg-gray-50 focus:bg-white focus:outline-none transition-all
              ${isConfirmed
                ? "border-danger/40 focus:ring-2 focus:ring-danger/20 text-danger"
                : "border-gray-200 focus:ring-2 focus:ring-gray-200 text-text"
              }`}
          />
        </div>

        {/* ── Error Banner ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-danger font-medium"
            >
              ⚠️ {error}
            </motion.p>
          )}
        </AnimatePresence>

      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
