import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineXMark, HiOutlineCamera, HiOutlineExclamationCircle } from "react-icons/hi2";

/**
 * CameraScannerModal — Camera-Based Barcode / QR Scanner
 *
 * Uses the html5-qrcode library which wraps the browser's MediaDevices API.
 * Supports Code 128, EAN-13, QR Code, and most 1D/2D formats natively.
 *
 * Features:
 * - Live camera viewfinder with animated scan line
 * - Real-time barcode detection via Html5Qrcode
 * - Graceful permission denial handling
 * - Manual entry fallback when camera is unavailable
 * - Clean stop/start lifecycle management (prevents memory leaks)
 * - Responsive: works on mobile (back camera preferred) and desktop
 *
 * @param {boolean}  isOpen     - Controls modal visibility
 * @param {function} onClose    - Close callback
 * @param {function} onDetected - Called with the scanned barcode string
 */
const CameraScannerModal = ({ isOpen, onClose, onDetected }) => {
  const { t } = useTranslation();
  const scannerRef = useRef(null);      // Html5Qrcode instance
  const viewfinderRef = useRef(null);   // DOM element for the scanner to render into

  const [status, setStatus] = useState("idle"); // idle | starting | scanning | error | stopped
  const [errorMsg, setErrorMsg] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [detected, setDetected] = useState(false);

  /** Start the camera scanner */
  const startScanner = useCallback(async () => {
    if (!viewfinderRef.current) return;
    setStatus("starting");
    setErrorMsg("");

    try {
      // Dynamically import to keep the bundle lean
      const { Html5Qrcode } = await import("html5-qrcode");

      // Ensure any previous instance is cleaned up
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch (_) {}
      }

      const html5QrCode = new Html5Qrcode("camera-scanner-viewfinder");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Prefer back camera on mobile
        {
          fps: 15,
          qrbox: { width: 260, height: 180 },
          aspectRatio: 1.5,
          // Scan all popular formats for clinic inventory scenarios
          formatsToSupport: undefined, // All formats
        },
        (decodedText) => {
          // Success callback — barcode detected
          setDetected(true);
          setStatus("stopped");

          // Stop scanner to release camera
          html5QrCode.stop().catch(() => {});

          // Brief flash then fire callback
          setTimeout(() => {
            onDetected(decodedText.trim());
            onClose();
          }, 400);
        },
        // Failure callback (per-frame miss — normal, not an error)
        () => {}
      );

      setStatus("scanning");
    } catch (err) {
      console.error("[CameraScanner] Error:", err);
      let msg = t("scanner.camera_error") || "Camera access failed.";

      if (err?.message?.includes("Permission") || err?.message?.includes("NotAllowed")) {
        msg = t("scanner.permission_denied") || "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err?.message?.includes("NotFound") || err?.message?.includes("DevicesNotFound")) {
        msg = t("scanner.no_camera") || "No camera found on this device.";
      }

      setErrorMsg(msg);
      setStatus("error");
    }
  }, [onDetected, onClose, t]);

  /** Stop the camera scanner and release MediaStream */
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {
        // Already stopped or never started — safe to ignore
      }
      scannerRef.current = null;
    }
    setStatus("idle");
  }, []);

  // Lifecycle: start on open, stop on close/unmount
  useEffect(() => {
    if (isOpen) {
      setDetected(false);
      setManualBarcode("");
      // Small delay so the DOM element is rendered before starting
      const timer = setTimeout(startScanner, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = manualBarcode.trim();
    if (code.length < 2) return;
    onDetected(code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div
              className="bg-surface rounded-2xl shadow-medium w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <HiOutlineCamera className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary text-sm">
                      {t("scanner.title") || "Camera Scanner"}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {t("scanner.subtitle") || "Point camera at a barcode"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-gray-100 hover:text-text"
                  aria-label="Close"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              {/* Viewfinder Area */}
              <div className="relative bg-black" style={{ minHeight: "240px" }}>
                {/* html5-qrcode renders inside this div */}
                <div
                  id="camera-scanner-viewfinder"
                  ref={viewfinderRef}
                  className="w-full"
                  style={{ minHeight: "240px" }}
                />

                {/* Scan line overlay (only when actively scanning) */}
                {status === "scanning" && !detected && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-[10%] right-[10%] h-[2px] bg-highlight/80 shadow-[0_0_8px_rgba(13,255,241,0.8)] scan-line" />
                    {/* Corner brackets */}
                    <div className="absolute top-[10%] left-[10%] w-8 h-8 border-t-2 border-l-2 border-highlight rounded-sm" />
                    <div className="absolute top-[10%] right-[10%] w-8 h-8 border-t-2 border-r-2 border-highlight rounded-sm" />
                    <div className="absolute bottom-[10%] left-[10%] w-8 h-8 border-b-2 border-l-2 border-highlight rounded-sm" />
                    <div className="absolute bottom-[10%] right-[10%] w-8 h-8 border-b-2 border-r-2 border-highlight rounded-sm" />
                  </div>
                )}

                {/* Starting state */}
                {status === "starting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-3">
                    <div className="spinner" />
                    <p className="text-white/70 text-sm">{t("scanner.starting") || "Starting camera..."}</p>
                  </div>
                )}

                {/* Detected success overlay */}
                {detected && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-highlight/20 scan-flash">
                      <svg className="w-8 h-8 text-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-highlight font-semibold text-sm">{t("scanner.detected") || "Barcode detected!"}</p>
                  </div>
                )}
              </div>

              {/* Error State */}
              {status === "error" && (
                <div className="border-b border-danger/10 bg-danger/5 px-7 py-5">
                  <div className="flex items-start gap-2">
                    <HiOutlineExclamationCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                    <p className="text-sm text-danger">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Status bar */}
              {status === "scanning" && (
                <div className="border-b border-highlight/10 bg-highlight/5 px-7 py-4">
                  <p className="text-xs text-center text-primary font-medium">
                    {t("scanner.scanning") || "🔍 Scanning — align barcode within the frame"}
                  </p>
                </div>
              )}

              {/* Manual Entry Fallback */}
              <div className="p-7">
                <p className="text-xs text-text-muted mb-3 font-medium uppercase tracking-wide">
                  {t("scanner.manual_label") || "Or enter barcode manually"}
                </p>
                <form onSubmit={handleManualSubmit} className="flex gap-4">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder={t("scanner.manual_placeholder") || "Type or paste barcode..."}
                    className="flex-1 rounded-xl border border-gray-200 bg-surface px-5 py-3.5 text-sm text-text
                      placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-highlight/40"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="h-12 whitespace-nowrap rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                  >
                    {t("common.search") || "Search"}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CameraScannerModal;
