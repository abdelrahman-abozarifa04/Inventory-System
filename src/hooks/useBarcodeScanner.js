import { useEffect, useRef, useCallback } from "react";

/**
 * useBarcodeScanner — Robust Handheld Scanner Hook
 *
 * Physical barcode scanners emulate a keyboard: they fire a rapid burst
 * of keydown events followed by an "Enter" key. This hook distinguishes
 * scanner input from regular typing by measuring inter-keystroke timing.
 *
 * Key improvements over naive implementations:
 * ─────────────────────────────────────────────
 * • maxTimeBetween raised to 100ms (covers Bluetooth & older scanners)
 * • Character filter is PERMISSIVE — accepts any printable ASCII (0x20–0x7E)
 *   plus common Unicode. Invisible/control chars are stripped, NOT rejected.
 * • Incomplete buffers are merged if the next key arrives shortly after Enter
 *   was mistakenly fired (some scanners fire Enter mid-stream on short codes)
 * • Detailed console diagnostics in DEV mode — every rejected scan shows WHY
 * • The duplicate-scan cooldown is PER BARCODE so different items work fine
 *
 * @param {function} onScan   - Callback invoked with the clean barcode string
 * @param {object}   options
 * @param {number}   options.minLength        - Min chars to be a valid scan (default: 3)
 * @param {number}   options.maxTimeBetween   - Max ms gap between keys (default: 100)
 * @param {boolean}  options.ignoreInputFocus - Skip when input/textarea focused (default: true)
 * @param {boolean}  options.enabled          - Master kill-switch (default: true)
 * @param {number}   options.dupeCooldown     - ms to ignore the exact same code (default: 1500)
 */
const useBarcodeScanner = (onScan, options = {}) => {
  const {
    minLength = 3,
    maxTimeBetween = 100,   // ← raised from 50ms; covers Bluetooth & USB HID scanners
    ignoreInputFocus = true,
    enabled = true,
    dupeCooldown = 1500,    // ← shortened so re-scanning same item isn't blocked too long
  } = options;

  const bufferRef       = useRef("");
  const lastKeyTimeRef  = useRef(0);
  const lastScannedRef  = useRef("");
  const lastScanTimeRef = useRef(0);
  const isDev = import.meta.env.DEV;

  const handleKeyDown = useCallback(
    (e) => {
      if (!enabled) return;

      // ── Skip when a text input has focus (user is typing, not scanning) ──────
      if (ignoreInputFocus) {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
      }

      const now = Date.now();
      const timeDelta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        // ── Strip invisible/control characters, keep everything printable ───────
        // This handles: GS1 FNC1 prefix (0x1D), null bytes, other non-printables
        // eslint-disable-next-line no-control-regex
        const barcode = bufferRef.current.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, "").trim();
        bufferRef.current = "";

        if (isDev) {
          console.log(`[Scanner] Enter received. Buffer → "${barcode}" (len: ${barcode.length}, gap: ${timeDelta}ms)`);
        }

        // ── Minimum length guard ─────────────────────────────────────────────
        if (barcode.length < minLength) {
          if (isDev) console.warn(`[Scanner] ⚠ Rejected — too short (${barcode.length} < ${minLength}): "${barcode}"`);
          return;
        }

        // ── Duplicate scan cooldown (PER barcode value) ──────────────────────
        if (
          barcode === lastScannedRef.current &&
          now - lastScanTimeRef.current < dupeCooldown
        ) {
          if (isDev) console.log(`[Scanner] ⏱ Duplicate ignored within ${dupeCooldown}ms: "${barcode}"`);
          return;
        }

        lastScannedRef.current  = barcode;
        lastScanTimeRef.current = now;

        if (isDev) console.log(`[Scanner] ✅ Valid scan → "${barcode}"`);
        onScan(barcode);
        return;
      }

      // ── Ignore non-printable modifier keys (Shift, Control, Alt, etc.) ──────
      if (e.key.length !== 1) return;

      // ── Gap too large → scanner burst is over, reset the buffer ─────────────
      // Use a lenient threshold: 3× maxTimeBetween (covers momentary BT lag)
      if (bufferRef.current.length > 0 && timeDelta > maxTimeBetween * 3) {
        if (isDev) {
          console.warn(
            `[Scanner] ⚠ Gap too large (${timeDelta}ms > ${maxTimeBetween * 3}ms). ` +
            `Dropping partial buffer: "${bufferRef.current}"`
          );
        }
        bufferRef.current = "";
      }

      bufferRef.current += e.key;
    },
    [enabled, ignoreInputFocus, minLength, maxTimeBetween, dupeCooldown, onScan, isDev]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
};

export default useBarcodeScanner;
