import { useState, useCallback } from "react";
import useToast from "./useToast";

/** Play a short 880Hz beep using the Web Audio API (no external assets needed) */
const playSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 880;
    osc.type = "sine";

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {
    console.warn("[Audio] WebAudio API not supported or blocked:", err);
  }
};

const playErrorSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 220; // Lower pitch = error
    osc.type = "sawtooth";

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
};

/**
 * useQuickDispense — Single-scan withdrawal hook
 *
 * Handles the complete Quick-Scan-to-Dispense flow:
 *   1. Receives a raw barcode string
 *   2. Looks up the item by serial_number | item_id | document id (case-insensitive)
 *   3a. Not found     → error toast + error beep
 *   3b. Out of stock  → warning toast + error beep
 *   3c. In stock      → atomic Firestore OUT transaction → success toast + beep
 *
 * @param {object[]} items            - Live inventory array from useInventory()
 * @param {function} recordTransaction - Atomic Firestore dispatcher from useTransactions()
 */
export const useQuickDispense = ({ items, recordTransaction }) => {
  const [lastDispensed, setLastDispensed] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  const dispense = useCallback(
    async (barcode) => {
      // Prevent multiple concurrent scans (e.g. double-fire from scanner)
      if (isProcessing) return;

      const cleanBarcode = barcode?.trim();
      if (!cleanBarcode) return;

      setIsProcessing(true);

      try {
        const normalized = cleanBarcode.toLowerCase();

        // ── Step 1: Multi-field lookup (case-insensitive) ────────────────────
        // Matches against:
        //   • serial_number  — the field used when adding items via InventoryModal
        //   • item_id        — the custom human-readable ID (also stored on the doc)
        //   • id             — the Firestore document ID itself
        const item = items.find(
          (i) =>
            i.serial_number?.toLowerCase() === normalized ||
            i.item_id?.toLowerCase() === normalized ||
            i.id?.toLowerCase() === normalized
        );

        // ── Step 2: Item not found ───────────────────────────────────────────
        if (!item) {
          playErrorSound();
          addToast({
            type: "error",
            message: `❌ Barcode not found: "${cleanBarcode}"`,
            duration: 4000,
          });
          return;
        }

        // ── Step 3: Out of stock ─────────────────────────────────────────────
        const currentQty = parseInt(item.quantity) || 0;
        if (currentQty <= 0) {
          playErrorSound();
          addToast({
            type: "warning",
            message: `⚠️ Out of stock: "${item.name_en || item.name_ar}" cannot be dispensed.`,
            duration: 5000,
          });
          return;
        }

        // ── Step 4: Execute the atomic Firestore OUT transaction ─────────────
        // recordTransaction handles:
        //   - Quantity decrement on inventory_items
        //   - Writing a new doc to transactions collection
        //   - Auto-alert if new qty drops below threshold
        await recordTransaction({
          itemDocId: item.id,
          type: "OUT",
          quantity_changed: 1,
        });

        // ── Step 5: Success feedback ─────────────────────────────────────────
        playSuccessSound();

        const newQuantity = currentQty - 1;

        addToast({
          type: "success",
          message: `✅ Dispensed: "${item.name_en || item.name_ar}" — Stock: ${newQuantity} remaining`,
          duration: 4500,
        });

        // Update the last-dispensed banner on the Transactions page
        setLastDispensed({
          name_en: item.name_en,
          name_ar: item.name_ar,
          serial_number: item.serial_number,
          item_id: item.item_id,
          id: item.id,
          newQuantity,
        });
      } catch (err) {
        console.error("[useQuickDispense] dispense() failed:", err);
        playErrorSound();
        addToast({
          type: "error",
          message: `❌ Transaction failed: ${err.message || "Please try again."}`,
          duration: 5000,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    // NOTE: isProcessing intentionally NOT in deps — we read it via closure to avoid
    // stale closure issues while keeping the callback stable for the scanner hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, recordTransaction, addToast]
  );

  return { dispense, lastDispensed, isProcessing };
};

export default useQuickDispense;
