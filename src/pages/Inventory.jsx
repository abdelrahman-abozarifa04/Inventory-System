import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  QrCode,
  Pencil,
  ArrowRightLeft,
  Search,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ClipboardList,
  Package,
  Store,
  Bell,
  Layers,
} from "lucide-react";

import useInventory from "../hooks/useInventory";
import useTransactions from "../hooks/useTransactions";
import useBarcodeScanner from "../hooks/useBarcodeScanner";
import useRestockScan from "../hooks/useRestockScan";
import InventoryModal from "../components/inventory/InventoryModal";
import TransactionModal from "../components/inventory/TransactionModal";
import BarcodeModal from "../components/inventory/BarcodeModal";
import CameraScannerModal from "../components/inventory/CameraScannerModal";
import RestockModal from "../components/inventory/RestockModal";
import DeleteConfirmModal from "../components/inventory/DeleteConfirmModal";
import ItemTransactionHistory from "../components/inventory/ItemTransactionHistory";
import BatchManagementPanel from "../components/inventory/BatchManagementPanel";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { SkeletonRows } from "../components/ui/Skeleton";

/**
 * Inventory Page
 *
 * Central inventory management page. Integrates:
 * - Handheld barcode scanner (keyboard-emulator via useBarcodeScanner)
 * - Camera scanner modal (CameraScannerModal)
 * - CRUD via InventoryModal
 * - Transaction recording via TransactionModal
 * - Code 128 barcode display via BarcodeModal
 * - Batch management slide-over panel (BatchManagementPanel)
 *
 * Scan Logic:
 *   1. A barcode is received (from handheld or camera)
 *   2. Search items by serial_number, item_id, or id
 *   3. FOUND     → open RestockModal (quantity picker + atomic IN transaction)
 *   4. NOT FOUND → open InventoryModal with barcode pre-filled in serial field
 */
const Inventory = () => {
  const { t, i18n } = useTranslation();
  const { items, loading, deleteItem } = useInventory();
  const { transactions } = useTransactions();

  const [searchTerm, setSearchTerm] = useState("");

  // --- Modal open states ---
  const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [isBarcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [isCameraScannerOpen, setCameraScannerOpen] = useState(false);
  const [isRestockModalOpen, setRestockModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isHistoryPanelOpen, setHistoryPanelOpen] = useState(false);
  const [isBatchPanelOpen, setBatchPanelOpen] = useState(false);

  // --- Selected item references ---
  const [activeItem, setActiveItem] = useState(null);

  // --- Scanner feedback toast ---
  const [scanToast, setScanToast] = useState(null);

  const isRTL = i18n.dir(i18n.language) === "rtl";

  // ─── Smart Restock Scan Hook ──────────────────────────────────────────────
  const {
    matchedItem,
    prefillBarcode,
    handleScanResult: scanRouter,
    confirmRestock,
    clearMatch,
    clearPrefill,
  } = useRestockScan(items);

  /** Show a scan toast banner, auto-dismiss after 3 seconds */
  const showScanToast = useCallback((type, barcode) => {
    setScanToast({ type, barcode });
    setTimeout(() => setScanToast(null), 3000);
  }, []);

  const handleScanBranch = useCallback(
    (barcode) => {
      if (!barcode) return;
      const normalized = barcode.trim().toLowerCase();
      const found = items.find(
        (itm) =>
          itm.serial_number?.toLowerCase() === normalized ||
          itm.item_id?.toLowerCase() === normalized ||
          itm.id?.toLowerCase() === normalized
      );

      if (found) {
        scanRouter(barcode);
        setRestockModalOpen(true);
        showScanToast("found", barcode);
      } else {
        scanRouter(barcode);
        setActiveItem(null);
        setAddEditModalOpen(true);
        showScanToast("notfound", barcode);
      }
    },
    [items, scanRouter, showScanToast]
  );

  // ─── Action Handlers ────────────────────────────────────────────────────────

  const handleAddNew = () => {
    clearPrefill();
    setActiveItem(null);
    setAddEditModalOpen(true);
  };

  const handleEdit = (item) => {
    setActiveItem(item);
    setAddEditModalOpen(true);
  };

  const handleTransaction = (item) => {
    setActiveItem(item);
    setTransactionModalOpen(true);
  };

  const handleBarcode = (item) => {
    setActiveItem(item);
    setBarcodeModalOpen(true);
  };

  const handleViewHistory = (item) => {
    setActiveItem(item);
    setHistoryPanelOpen(true);
  };

  const handleBatchPanel = (item) => {
    setActiveItem(item);
    setBatchPanelOpen(true);
  };

  const handleDeleteRequest = (item) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (itemId) => {
    await deleteItem(itemId);
    if (activeItem?.id === itemId) setActiveItem(null);
  };

  // ─── Handheld Barcode Scanner Hook ─────────────────────────────────────────
  useBarcodeScanner(handleScanBranch, {
    enabled:
      !isAddEditModalOpen &&
      !isTransactionModalOpen &&
      !isBarcodeModalOpen &&
      !isCameraScannerOpen &&
      !isRestockModalOpen &&
      !isDeleteModalOpen &&
      !isHistoryPanelOpen &&
      !isBatchPanelOpen,
  });

  // ─── Filter Items ──────────────────────────────────────────────────────────
  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.name_en?.toLowerCase().includes(q) ||
      item.name_ar?.toLowerCase().includes(q) ||
      item.serial_number?.toLowerCase().includes(q) ||
      item.item_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col transition-colors">

      {/* ── Scan Toast Notification ───────────────────────────────────────── */}
      <AnimatePresence>
        {scanToast && (
          <motion.div
            key="scan-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`fixed top-24 inset-x-0 mx-auto w-fit z-[70] px-5 py-3 rounded-2xl shadow-medium
              flex items-center gap-3 text-sm font-semibold
              ${scanToast.type === "found"
                ? "bg-success/10 border border-success/30 text-success"
                : "bg-warning/10 border border-warning/30 text-warning"
              }`}
          >
            {scanToast.type === "found" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" />
            )}
            <span>
              {scanToast.type === "found"
                ? (t("scanner.toast_found", "Item found — opening restock dialog."))
                : (t("scanner.toast_notfound", `New item: ${scanToast.barcode} — open add form.`))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header Area ───────────────────────────────────────────────────── */}
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-text sm:text-3xl">{t("inventory.title")}</h2>
          <p className="max-w-2xl text-sm leading-6 text-text-muted">{t("inventory.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="w-full sm:w-72">
            <Input
              id="inventory-search"
              type="text"
              placeholder={t("inventory.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={Search}
              className="h-11"
            />
          </div>

          {/* Camera Scanner Button */}
          <Button
            id="camera-scan-btn"
            onClick={() => setCameraScannerOpen(true)}
            variant="subtle"
            size="lg"
            title={t("scanner.scan_to_add") || "Scan to Add / Lookup"}
          >
            <Camera className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{t("scanner.scan_to_add") || "Scan"}</span>
          </Button>

          {/* Add Item Button */}
          <Button
            id="add-item-btn"
            onClick={handleAddNew}
            size="lg"
          >
            <Plus className="h-5 w-5 shrink-0" />
            <span>{t("inventory.add_item")}</span>
          </Button>
        </div>
      </div>

      {/* ── Scanner Hint Banner ────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-highlight/20 bg-highlight/5 px-6 py-5">
        <Camera className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-primary font-medium">
          {t("scanner.hint_handheld") ||
            "Handheld scanner ready — scan any barcode to instantly look up an item or pre-fill a new item form."}
        </p>
      </div>

      {/* ── Main Table Container ───────────────────────────────────────────── */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Table Header */}
        <div className="sticky top-0 z-10 hidden grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/95 px-6 py-4
          text-xs font-bold text-text-muted uppercase tracking-wider backdrop-blur md:grid">
          <div className="col-span-4 md:col-span-3">{t("inventory.table.item")}</div>
          <div className="col-span-2 text-center md:text-start">{t("inventory.table.stock")}</div>
          <div className="col-span-2 text-center md:text-start">{t("inventory.table.price")}</div>
          <div className="hidden md:block col-span-3">{t("inventory.table.dates")}</div>
          <div className="col-span-4 md:col-span-2 text-end">{t("inventory.table.actions")}</div>
        </div>

        {/* Scrollable Table Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <SkeletonRows rows={7} />
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-text-muted gap-2">
              <p className="text-sm font-medium">{t("common.noData")}</p>
              {searchTerm && (
                <p className="text-xs text-text-muted">
                  {t("inventory.search_no_results") || `No results for "${searchTerm}"`}
                </p>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {filteredItems.map((item, index) => {
                const currentQty = item.total_quantity ?? item.quantity ?? 0;
                const isLowStock = currentQty <= (item.minimum_threshold || 5);

                return (
                  <motion.div
                    key={item.id}
                    id={`inventory-row-${item.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 28 }}
                    className="flex flex-col gap-4 border-b border-gray-50 px-6 py-6
                      hover:bg-surface-hover transition-colors group md:grid md:grid-cols-12 md:items-center md:gap-4"
                  >
                    {/* Item Info — with optional product thumbnail */}
                    <div className="col-span-12 md:col-span-3 flex items-center gap-3 min-w-0">
                      {/* Thumbnail */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                        {item.image_base64 ? (
                          <img
                            src={item.image_base64}
                            alt={item.name_en}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-text-muted" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-primary mb-0.5 truncate">
                          {isRTL ? item.name_ar : item.name_en}
                        </span>
                        <span className="mt-1 w-fit max-w-full truncate rounded bg-gray-100 px-2.5 py-1 font-mono text-xs text-text-muted">
                          {item.serial_number || item.item_id || item.id}
                        </span>
                        {item.merchant_name && (
                          <span className="mt-1.5 truncate text-[10px] text-text-muted">
                            <Store className="inline h-3 w-3" /> {item.merchant_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="col-span-12 md:col-span-2 flex items-center justify-between md:justify-start gap-2 border-t border-gray-50 pt-3 md:border-t-0 md:pt-0">
                      <span className="text-xs text-text-muted font-bold md:hidden">{t("inventory.table.stock")}:</span>
                      <div className="flex flex-col gap-1 md:items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xl text-text">{currentQty}</span>
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5
                              text-[10px] font-bold uppercase tracking-wider
                              text-danger bg-danger/10 border border-danger/20 rounded-full">
                              {t("inventory.low_stock")}
                            </span>
                          )}
                        </div>
                        {item.batch_count > 0 && (
                          <span className="text-[10px] font-semibold text-text-muted bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 flex items-center gap-1">
                            <Layers className="w-2.5 h-2.5" />
                            {item.batch_count} {item.batch_count === 1 ? (isRTL ? "دفعة" : "batch") : (isRTL ? "دفعات" : "batches")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unit Price (EGP) */}
                    <div className="col-span-12 md:col-span-2 flex items-center justify-between md:justify-start border-t border-gray-50 pt-3 md:border-t-0 md:pt-0">
                      <span className="text-xs text-text-muted font-bold md:hidden">{t("inventory.table.price")}:</span>
                      {item.unit_price != null && item.unit_price > 0 ? (
                        <span className="font-bold text-sm text-text">
                          {Number(item.unit_price).toLocaleString(isRTL ? "ar-EG" : "en-EG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          <span className="text-[10px] font-semibold text-text-muted ms-1">
                            {isRTL ? "ج.م" : "EGP"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </div>

                    {/* Dates + Alert */}
                    <div className="col-span-12 md:col-span-3 flex flex-col gap-1 md:gap-0.5 border-t border-gray-50 pt-3 md:border-t-0 md:pt-0 text-xs text-text-muted">
                      <div className="flex items-center justify-between md:block">
                        <span className="text-xs text-text-muted font-bold md:hidden">Exp:</span>
                        {item.nearest_expiry || item.expiration_date ? (
                          <div className="flex flex-col md:items-start">
                            <span className="font-semibold text-text">
                              {item.nearest_expiry || item.expiration_date}
                            </span>
                            {item.nearest_expiry && (
                              <span className="text-[9px] font-bold text-primary uppercase mt-0.5">
                                {isRTL ? "الأقرب انتهاءً" : "Nearest Expiry"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>{t("inventory.no_exp")}</span>
                        )}
                      </div>
                      {item.production_date && (
                        <div className="flex items-center justify-between md:block mt-1.5 md:mt-0.5">
                          <span className="text-xs text-text-muted font-bold md:hidden">Prod:</span>
                          <span className="font-medium text-text">{item.production_date}</span>
                        </div>
                      )}
                      {item.alert_trigger_date && (
                        <div className="flex items-center justify-between md:block mt-1.5 md:mt-0.5">
                          <span className="text-xs text-text-muted font-bold md:hidden">Alert:</span>
                          <span className="inline-flex items-center gap-1 text-warning font-medium">
                            <Bell className="inline h-3 w-3" /> {item.alert_trigger_date}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-12 flex items-center justify-between gap-2 border-t border-gray-50 pt-3.5 md:col-span-2 md:justify-end md:border-t-0 md:pt-0">
                      <span className="text-xs text-text-muted font-bold md:hidden">{t("inventory.table.actions")}:</span>
                      <div className="flex items-center gap-2">
                        {/* IN / OUT Transaction */}
                        <button
                          id={`txn-btn-${item.id}`}
                          onClick={() => handleTransaction(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg
                            text-text-muted hover:text-success hover:bg-success/10
                            transition-colors border border-gray-100 shadow-sm bg-surface cursor-pointer"
                          title="Record IN / OUT"
                        >
                          <ArrowRightLeft className="h-4.5 w-4.5 md:h-4 md:w-4" />
                        </button>

                        {/* View Transaction History */}
                        <button
                          id={`history-btn-${item.id}`}
                          onClick={() => handleViewHistory(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg
                            text-text-muted hover:text-info hover:bg-info/10
                            transition-colors border border-gray-100 shadow-sm bg-surface cursor-pointer"
                          title="View Transaction History"
                        >
                          <ClipboardList className="h-4.5 w-4.5 md:h-4 md:w-4" />
                        </button>

                        {/* Barcode */}
                        <button
                          id={`barcode-btn-${item.id}`}
                          onClick={() => handleBarcode(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg
                            text-text-muted hover:text-primary hover:bg-primary/10
                            transition-colors border border-gray-100 shadow-sm bg-surface cursor-pointer"
                          title="View Barcode"
                        >
                          <QrCode className="h-4.5 w-4.5 md:h-4 md:w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          id={`edit-btn-${item.id}`}
                          onClick={() => handleEdit(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg
                            text-text-muted hover:text-highlight hover:bg-highlight/10
                            transition-colors border border-gray-100 shadow-sm bg-surface cursor-pointer"
                          title="Edit Item"
                        >
                          <Pencil className="h-4.5 w-4.5 md:h-4 md:w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          id={`delete-btn-${item.id}`}
                          onClick={() => handleDeleteRequest(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg
                            text-text-muted hover:text-danger hover:bg-danger/10
                            transition-colors border border-gray-100 shadow-sm bg-surface cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="h-4.5 w-4.5 md:h-4 md:w-4" />
                        </button>

                        {/* Manage Batches */}
                        <button
                          id={`batch-btn-${item.id}`}
                          onClick={() => handleBatchPanel(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg
                            text-text-muted hover:text-primary hover:bg-primary/10
                            transition-colors border border-gray-100 shadow-sm bg-surface cursor-pointer"
                          title={isRTL ? "إدارة الدفعات" : "Manage Batches"}
                        >
                          <Layers className="h-4.5 w-4.5 md:h-4 md:w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Table Footer */}
        {!loading && filteredItems.length > 0 && (
          <div className="border-t border-gray-50 bg-gray-50/50 px-7 py-5">
            <p className="text-xs text-text-muted">
              {t("transactions.showing")} <span className="font-semibold text-text">{filteredItems.length}</span>{" "}
              {t("transactions.of")} <span className="font-semibold text-text">{items.length}</span>{" "}
              {t("inventory.items_total") || "items"}
            </p>
          </div>
        )}
      </Card>

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* Add / Edit item */}
      <InventoryModal
        isOpen={isAddEditModalOpen}
        onClose={() => { setAddEditModalOpen(false); clearPrefill(); }}
        existingItem={activeItem}
        prefillBarcode={prefillBarcode}
      />

      {/* Manual IN / OUT transaction */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        item={activeItem}
      />

      {/* Barcode display */}
      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        item={activeItem}
      />

      {/* Camera scanner */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        onDetected={handleScanBranch}
      />

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => { setRestockModalOpen(false); clearMatch(); }}
        item={matchedItem}
        onConfirm={confirmRestock}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); }}
        item={activeItem}
        onConfirm={handleDeleteConfirm}
      />

      {/* Product Transaction History Slide Panel */}
      <AnimatePresence>
        {isHistoryPanelOpen && (
          <ItemTransactionHistory
            isOpen={isHistoryPanelOpen}
            onClose={() => { setHistoryPanelOpen(false); }}
            item={activeItem}
            transactions={transactions}
          />
        )}
      </AnimatePresence>

      {/* Batch Management Slide Panel */}
      <AnimatePresence>
        {isBatchPanelOpen && (
          <BatchManagementPanel
            isOpen={isBatchPanelOpen}
            onClose={() => { setBatchPanelOpen(false); }}
            item={activeItem}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
