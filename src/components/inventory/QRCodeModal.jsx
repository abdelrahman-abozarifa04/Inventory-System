import { useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import Modal from "../ui/Modal";
import { HiOutlineArrowDownTray, HiOutlinePrinter } from "react-icons/hi2";

/**
 * Renders a printable QR Code representing the item's unique data.
 * QR payload is a structured JSON with item ID, serial, and bilingual names.
 * Includes Download (PNG) and Print capabilities.
 */
const QRCodeModal = ({ isOpen, onClose, item }) => {
  const { t, i18n } = useTranslation();
  const qrRef = useRef(null);
  const isRTL = i18n.dir(i18n.language) === "rtl";

  // Build structured QR payload
  const qrPayload = item ? JSON.stringify({
    id: item.id,
    serial: item.serial_number || item.item_id || item.id,
    name_en: item.name_en,
    name_ar: item.name_ar,
  }) : "";

  // Download as PNG
  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    canvas.width = 400;
    canvas.height = 400;

    img.onload = () => {
      // White background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 400, 400);

      const link = document.createElement("a");
      link.download = `QR_${item?.serial_number || item?.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [item]);

  // Print QR code
  const handlePrint = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head><title>QR Code — ${item?.name_en}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
          <div style="text-align:center;">
            ${svgData}
            <h3 style="margin-top:16px;">${item?.name_en}</h3>
            <p style="margin-top:4px;color:#666;font-family:monospace;font-size:14px;">${item?.serial_number || item?.item_id || item?.id}</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [item]);

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("inventory.modals.qr_title")}
      maxWidth="max-w-sm"
    >
      <div className="flex flex-col items-center justify-center p-4">
        {/* QR Code */}
        <div ref={qrRef} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-5">
          <QRCodeSVG
            value={qrPayload}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>
        
        {/* Item Info */}
        <h4 className="text-lg font-bold text-center text-primary mb-0.5">
          {isRTL ? item.name_ar : item.name_en}
        </h4>
        {item.name_ar && item.name_en && (
          <p className="text-sm text-text-muted text-center mb-2">
            {isRTL ? item.name_en : item.name_ar}
          </p>
        )}
        <p className="text-sm font-mono text-text-muted bg-primary/5 px-3 py-1 rounded-md mb-6">
          {item.serial_number || item.item_id || item.id}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
          >
            <HiOutlineArrowDownTray className="w-4 h-4" />
            {t("qr.download") || "Download PNG"}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors border border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
          >
            <HiOutlinePrinter className="w-4 h-4" />
            {t("qr.print") || "Print"}
          </button>
        </div>

        <p className="text-xs text-center text-text-muted mt-5 max-w-xs leading-relaxed">
          {t("qr.hint") || "Scan this code to quickly pull up the item or record IN/OUT transactions."}
        </p>
      </div>
    </Modal>
  );
};

export default QRCodeModal;
