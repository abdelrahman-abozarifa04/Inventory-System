import { useEffect, useRef, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Modal from "../ui/Modal";
import {
  HiOutlineArrowDownTray,
  HiOutlinePrinter,
  HiOutlineBarsArrowDown,
} from "react-icons/hi2";

/**
 * BarcodeModal — Code 128 Barcode Generator
 *
 * Replaces the previous QR Code modal with an industry-standard
 * Code 128 barcode (the most widely used in inventory management).
 *
 * Code 128 encodes the item's serial_number / item_id.
 * It is scannable by all commercial handheld barcode scanners.
 *
 * Features:
 * - Renders barcode as inline SVG (crisp at any size)
 * - Human-readable text displayed BELOW the barcode
 * - Download as PNG (canvas rasterization)
 * - Print-optimized: black on white, scanner-readable
 * - Graceful error handling if JsBarcode fails (invalid chars)
 *
 * @param {boolean}  isOpen  - Modal open state
 * @param {function} onClose - Close callback
 * @param {object}   item    - Inventory item (requires serial_number or id)
 */
const BarcodeModal = ({ isOpen, onClose, item }) => {
  const { t, i18n } = useTranslation();
  const barcodeRef = useRef(null);   // SVG element ref
  const containerRef = useRef(null); // Wrapping div for print area
  const isRTL = i18n.dir(i18n.language) === "rtl";
  const [printScale, setPrintScale] = useState(3);
  const [showSavedHint, setShowSavedHint] = useState(false);

  const normalizeBarcodeValue = useCallback((value) => {
    if (value === null || value === undefined) return "";

    const digitMap = {
      "٠": "0",
      "١": "1",
      "٢": "2",
      "٣": "3",
      "٤": "4",
      "٥": "5",
      "٦": "6",
      "٧": "7",
      "٨": "8",
      "٩": "9",
      "۰": "0",
      "۱": "1",
      "۲": "2",
      "۳": "3",
      "۴": "4",
      "۵": "5",
      "۶": "6",
      "۷": "7",
      "۸": "8",
      "۹": "9",
    };

    const normalized = String(value)
      .trim()
      .split("")
      .map((ch) => digitMap[ch] || ch)
      .join("")
      .replace(/[^\x20-\x7E]/g, "");

    const withoutPrefix = normalized.replace(/^ITM-?/i, "");

    return withoutPrefix;
  }, []);

  const rawBarcodeValue = item
    ? (item.serial_number || item.item_id || item.id || "UNKNOWN")
    : "";

  // The value encoded in the barcode — prefer serial, fallback to item_id/id
  const barcodeValue =
    normalizeBarcodeValue(rawBarcodeValue) ||
    (item?.id ? String(item.id) : "UNKNOWN");

  /** Render the barcode into the SVG element using JsBarcode */
  const renderBarcode = useCallback(async () => {
    if (!item || !barcodeRef.current) return;

    try {
      const JsBarcode = (await import("jsbarcode")).default;

      JsBarcode(barcodeRef.current, barcodeValue, {
        format: "CODE128",        // Industry-standard 1D barcode
        width: 2.2,               // Bar width in px — balances density vs. scannability
        height: 80,               // Bar height in px
        displayValue: true,       // Show human-readable text below
        text: barcodeValue,       // Text shown below (same as encoded value)
        fontOptions: "bold",
        font: "Inter, monospace",
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 6,
        fontSize: 13,
        background: "#FFFFFF",    // White background for contrast
        lineColor: "#000000",     // Maximum contrast — black bars
        margin: 12,
        marginTop: 12,
        marginBottom: 12,
        marginLeft: 20,
        marginRight: 20,
      });
    } catch (err) {
      console.error("[BarcodeModal] JsBarcode render error:", err);
      // If barcode value contains invalid chars for CODE128, show fallback
      if (barcodeRef.current) {
        barcodeRef.current.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#EF4444" font-size="12">Invalid barcode value</text>`;
      }
    }
  }, [item, barcodeValue]);

  // Load saved print quality
  useEffect(() => {
    const savedScale = Number(localStorage.getItem("barcodePrintScale"));
    if (!Number.isNaN(savedScale) && savedScale >= 2 && savedScale <= 5) {
      setPrintScale(savedScale);
    }
  }, []);

  // Persist print quality
  useEffect(() => {
    localStorage.setItem("barcodePrintScale", String(printScale));
    setShowSavedHint(true);
    const timeoutId = setTimeout(() => setShowSavedHint(false), 1200);
    return () => clearTimeout(timeoutId);
  }, [printScale]);

  // Re-render barcode whenever the modal opens with an item
  useEffect(() => {
    if (isOpen && item) {
      // nextTick — wait for SVG to be in DOM
      setTimeout(renderBarcode, 100);
    }
  }, [isOpen, item, renderBarcode]);

  /** Download barcode as PNG image */
  const handleDownload = useCallback(() => {
    const svg = barcodeRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Use intrinsic SVG dimensions
    const svgWidth = svg.width?.baseVal?.value || 350;
    const svgHeight = svg.height?.baseVal?.value || 150;
    const scale = printScale;

    canvas.width = svgWidth * scale;
    canvas.height = svgHeight * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;

    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, svgWidth, svgHeight);
      ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

      const link = document.createElement("a");
      link.download = `Barcode_${barcodeValue}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  }, [barcodeValue, printScale]);

  /** Print barcode in a clean print window */
  const handlePrint = useCallback(() => {
    const svg = barcodeRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const itemName = isRTL ? item?.name_ar : item?.name_en;
    const baseWidth = 500;
    const baseHeight = 420;
    const windowWidth = Math.round(baseWidth * (printScale / 3));
    const windowHeight = Math.round(baseHeight * (printScale / 3));
    const printWindow = window.open(
      "",
      "_blank",
      `width=${windowWidth},height=${windowHeight}`
    );
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode — ${itemName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: 'Inter', system-ui, sans-serif;
              background: white;
              padding: 32px;
            }
            .barcode-wrap { text-align: center; }
            .item-name {
              margin-top: 16px;
              font-size: 16px;
              font-weight: 700;
              color: #1B3C53;
            }
            .item-serial {
              margin-top: 4px;
              font-size: 12px;
              color: #6b7280;
              font-family: monospace;
            }
            svg { display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="barcode-wrap">
            ${svgData}
            <p class="item-name">${itemName || ""}</p>
            <p class="item-serial">${barcodeValue}</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [item, barcodeValue, isRTL]);

  // All hooks must be called above this guard
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("barcode.title") || "Item Barcode"}
      maxWidth="max-w-sm"
    >
      <div className="flex flex-col items-center gap-8 py-2" ref={containerRef}>

        {/* Barcode Display */}
        <motion.div
          className="barcode-print-area flex w-full justify-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* JsBarcode renders into this SVG element */}
          <svg
            ref={barcodeRef}
            xmlns="http://www.w3.org/2000/svg"
            className="max-w-full"
          />
        </motion.div>

        {/* Item Info */}
        <div className="mt-1 flex w-full flex-col items-center gap-3 text-center">
          <h4 className="text-base font-bold text-primary">
            {isRTL ? item.name_ar : item.name_en}
          </h4>
          {item.name_ar && item.name_en && (
            <p className="text-sm text-text-muted mt-0.5">
              {isRTL ? item.name_en : item.name_ar}
            </p>
          )}
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/10 bg-primary/5 px-3 py-1">
            <HiOutlineBarsArrowDown className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono font-semibold text-primary">
              {barcodeValue}
            </span>
          </div>
          <p className="text-xs text-text-muted">
            FORMAT: Code 128
          </p>
        </div>

        {/* Print Quality */}
        <div
          className="mt-1 flex w-full flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <label className="text-xs font-semibold text-text-muted">
            {t("barcode.quality") || "Print quality"}
          </label>
          <select
            value={printScale}
            onChange={(event) => setPrintScale(Number(event.target.value))}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-text sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
          >
            <option value={2}>Standard (2x)</option>
            <option value={3}>High (3x)</option>
            <option value={4}>Very High (4x)</option>
            <option value={5}>Ultra (5x)</option>
          </select>
          {showSavedHint && (
            <span className="text-[11px] font-semibold text-emerald-600">
              {t("common.saved") || "Saved"}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-1 flex w-full items-center gap-4">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3
              bg-primary text-white font-semibold text-sm
              hover:bg-primary-dark active:scale-95 transition-all shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
          >
            <HiOutlineArrowDownTray className="w-4 h-4 shrink-0" />
            {t("barcode.download") || "Download PNG"}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3
              bg-primary/10 text-primary font-semibold text-sm
              hover:bg-primary/20 active:scale-95 transition-all border border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
          >
            <HiOutlinePrinter className="w-4 h-4 shrink-0" />
            {t("barcode.print") || "Print"}
          </button>
        </div>

        {/* Hint */}
        <p className="mt-3 max-w-sm text-center text-xs leading-relaxed text-text-muted">
          {t("barcode.hint") ||
            "Scan this Code 128 barcode with any barcode scanner to instantly look up this item or record IN/OUT transactions."}
        </p>
      </div>
    </Modal>
  );
};

export default BarcodeModal;
