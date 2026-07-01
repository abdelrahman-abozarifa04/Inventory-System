import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Funnel,
  CalendarDays,
  Camera,
} from "lucide-react";
import useTransactions from "../hooks/useTransactions";
import useInventory from "../hooks/useInventory";
import useBarcodeScanner from "../hooks/useBarcodeScanner";
import useQuickDispense from "../hooks/useQuickDispense";
import CameraScannerModal from "../components/inventory/CameraScannerModal";
import Button from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SkeletonRows } from "../components/ui/Skeleton";

const PAGE_SIZE = 15;

const Transactions = () => {
  const { t, i18n } = useTranslation();
  const { transactions, loading: txLoading, recordTransaction } = useTransactions();
  const { items, loading: invLoading } = useInventory();

  const loading = txLoading || invLoading;

  // Create a fast lookup map for inventory items by their internal document ID
  // and by their custom item_id if applicable.
  const itemMap = useMemo(() => {
    const map = {};
    items.forEach(item => {
      map[item.id] = item;
      if (item.item_id) map[item.item_id] = item;
    });
    return map;
  }, [items]);
  const isRTL = i18n.dir(i18n.language) === "rtl";

  const [filterType, setFilterType] = useState("ALL"); // ALL | IN | OUT
  const [currentPage, setCurrentPage] = useState(1);

  // Quick Dispense
  const { dispense, lastDispensed, isProcessing } = useQuickDispense({
    items,
    recordTransaction,
  });

  const [isCameraScannerOpen, setCameraScannerOpen] = useState(false);

  // Attach scanner to this page automatically (hardware scanners)
  useBarcodeScanner(dispense, { ignoreInputFocus: true });

  // Filter transactions
  const filtered = useMemo(() => {
    if (filterType === "ALL") return transactions;
    return transactions.filter((txn) => txn.type === filterType);
  }, [transactions, filterType]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  };

  return (
    <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-text sm:text-3xl">{t("transactions.title")}</h2>
          <p className="text-sm text-text-muted">{t("transactions.description")}</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 rounded-2xl border border-gray-100 bg-surface p-2 shadow-card">
          <Funnel className="ms-2 h-4 w-4 text-text-muted" />
          {["ALL", "IN", "OUT"].map((type) => (
            <button
              key={type}
              onClick={() => handleFilterChange(type)}
              className={`
                rounded-xl px-5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all
                ${filterType === type
                  ? type === "IN"
                    ? "bg-success/15 text-success border border-success/30"
                    : type === "OUT"
                      ? "bg-danger/15 text-danger border border-danger/30"
                      : "bg-primary/15 text-primary border border-primary/30"
                  : "bg-surface text-text-muted border border-gray-200 hover:bg-surface-hover"
                }
              `}
            >
              {type === "ALL" ? t("transactions.filter_all") : type === "IN" ? t("transactions.filter_in") : t("transactions.filter_out")}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Scan Active Banner */}
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-success/20 bg-success/5 p-7 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-success">
              {t("transactions.quick_scan_active", "Quick Scan to Dispense Active")}
            </h3>
            <p className="text-xs text-success/80">
              {t("transactions.quick_scan_desc", "Scan barcodes to automatically dispense 1 item")}
            </p>
          </div>
        </div>

        {isProcessing ? (
          <div className="flex items-center gap-2 text-success text-sm font-medium px-4">
            <span className="w-4 h-4 border-2 border-success/30 border-t-success rounded-full animate-spin" />
            {t("common.loading", "Processing...")}
          </div>
        ) : lastDispensed ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/60 dark:bg-black/20 rounded-xl px-4 py-2 border border-success/10 flex items-center gap-4"
          >
            <div>
              <p className="text-xs font-bold text-primary">
                {isRTL ? lastDispensed.name_ar : lastDispensed.name_en}
              </p>
              <p className="text-[10px] text-text-muted font-mono mt-0.5">
                {lastDispensed.serial_number || lastDispensed.item_id || lastDispensed.id}
              </p>
            </div>
            <div className="h-6 w-px bg-success/20 shrink-0" />
            <div className="text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-0.5">Stock</p>
              <p className="text-sm font-bold text-success leading-none">{lastDispensed.newQuantity}</p>
            </div>
          </motion.div>
        ) : (
          <Button
            onClick={() => setCameraScannerOpen(true)}
            variant="success"
            size="sm"
          >
            <Camera className="h-4 w-4" />
            {t("scanner.use_camera", "Use Camera Scanner")}
          </Button>
        )}
      </div>

      {/* Summary Bar */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-surface p-8 text-center shadow-card">
          <div className="absolute top-0 start-0 w-1.5 h-full bg-primary" />
          <p className="text-5xl font-bold text-primary">{transactions.length}</p>
          <p className="mt-3 text-sm font-bold uppercase tracking-wider text-text-muted">{t("transactions.total")}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-surface p-8 text-center shadow-card">
          <div className="absolute top-0 start-0 w-1.5 h-full bg-success" />
          <p className="text-5xl font-bold text-success">{transactions.filter(t => t.type === "IN").length}</p>
          <p className="mt-3 text-sm font-bold uppercase tracking-wider text-text-muted">{t("transactions.total_in")}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-surface p-8 text-center shadow-card">
          <div className="absolute top-0 start-0 w-1.5 h-full bg-danger" />
          <p className="text-5xl font-bold text-danger">{transactions.filter(t => t.type === "OUT").length}</p>
          <p className="mt-3 text-sm font-bold uppercase tracking-wider text-text-muted">{t("transactions.total_out")}</p>
        </div>
      </div>

      {/* Table */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        {/* Table Header */}
          <div className="sticky top-0 z-10 hidden grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/95 px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted md:grid">
          <div className="col-span-1">#</div>
          <div className="col-span-3">{t("transactions.col_item")}</div>
          <div className="col-span-2 text-center">{t("transactions.col_type")}</div>
          <div className="col-span-2 text-center">{t("transactions.col_qty")}</div>
          <div className="col-span-2">{t("transactions.col_user")}</div>
          <div className="col-span-2">{t("transactions.col_date")}</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <SkeletonRows rows={8} />
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-text-muted">
              <ArrowRightLeft className="mb-3 h-12 w-12 opacity-30" />
              <p>{t("transactions.no_data")}</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <AnimatePresence>
                {paginated.map((txn, index) => {
                  const rowNum = (currentPage - 1) * PAGE_SIZE + index + 1;
                  return (
                    <motion.div
                      key={txn.id}
                      variants={rowVariants}
                      className="grid grid-cols-1 items-center gap-3 border-b border-gray-50 px-6 py-5 transition-colors hover:bg-surface-hover md:grid-cols-12 md:gap-4"
                    >
                      {/* Row number */}
                      <div className="hidden md:block col-span-1 text-xs text-text-muted font-mono">{rowNum}</div>

                      {/* Item Name */}
                      <div className="col-span-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-primary">
                            {isRTL
                              ? (txn.item_name_ar || itemMap[txn.item_id]?.name_ar || txn.item_id)
                              : (txn.item_name_en || itemMap[txn.item_id]?.name_en || txn.item_id)
                            }
                          </span>
                          {(txn.item_name_en || txn.item_name_ar) && (
                            <span className="text-[10px] font-mono text-text-muted mt-0.5 opacity-60">
                              {txn.item_id}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div className="col-span-2 flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 font-bold text-xs px-4 py-1.5 rounded-full uppercase
                            ${txn.type === "IN" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                          {txn.type === "IN" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          {txn.type}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2 text-center text-lg font-bold">
                        <span className={`${txn.type === "IN" ? "text-success" : "text-danger"}`}>
                          {txn.type === "IN" ? "+" : "-"}{txn.quantity_changed}
                        </span>
                      </div>

                      {/* User */}
                      <div className="col-span-2 text-sm text-text-muted font-medium truncate">{txn.user_name}</div>

                      {/* Date */}
                      <div className="col-span-2 flex items-center justify-end md:justify-start gap-1.5 text-[10px] text-text-muted font-medium">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span>{new Date(txn.date).toLocaleString(isRTL ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-8 py-6">
            <p className="text-sm text-text-muted">
              {t("transactions.showing")} {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} {t("transactions.of")} {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 w-10 rounded-lg text-xs font-medium transition-all
                    ${page === currentPage
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-muted hover:bg-primary/10"
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        onDetected={dispense}
      />
    </div>
  );
};

export default Transactions;
