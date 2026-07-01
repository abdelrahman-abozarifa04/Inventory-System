import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineQrCode,
  HiOutlineArrowUpTray,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineBuildingStorefront,
  HiOutlineArchiveBox,
  HiOutlineBell,
  HiOutlineCalendarDays,
  HiOutlineInformationCircle,
} from "react-icons/hi2";

import Modal from "../ui/Modal";
import useInventory from "../../hooks/useInventory";
import CategorySelect from "./CategorySelect";
import TradeNameSelect from "./TradeNameSelect";
import { compressImage, formatFileSize } from "../../utils/imageUtils";
import {
  calculateAlertDate,
  validateAlertDate,
  formatDisplayDate,
  LEAD_TIME_UNITS,
} from "../../utils/alertUtils";

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_IMAGE_SIZE_MB  = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const EMPTY_FORM = {
  name_en:           "",
  name_ar:           "",
  category_id:       "",
  category_name_en:  "",
  category_name_ar:  "",
  trade_name_id:     "",
  trade_name_en:     "",
  trade_name_ar:     "",
  quantity:          0,
  serial_number:     "",
  production_date:   "",
  expiration_date:   "",
  minimum_threshold: 5,
  unit_price:        "",
  merchant_name:     "",
  warehouse_name:    "",
  warehouse_id:      "",
  alert_lead_value:  "",   // empty = no alert configured
  alert_lead_unit:   "days",
};

// ─── Sub-component: Section Header ───────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="mb-6 flex items-start gap-3">
    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h4 className="text-sm font-bold text-primary">{title}</h4>
      {description && <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>}
    </div>
  </div>
);

// ─── Sub-component: Image Upload Zone ────────────────────────────────────────
const ImageUploadZone = ({ previewUrl, onFileSelect, onClear, disabled }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = ()  => setIsDragging(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="relative">
      {previewUrl ? (
        /* ── Preview State ── */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-2xl overflow-hidden border-2 border-success/30 bg-success/5"
          style={{ height: 200 }}
        >
          <img
            src={previewUrl}
            alt="Product preview"
            className="w-full h-full object-contain p-2"
          />
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="absolute top-2 end-2 w-7 h-7 bg-danger/90 text-white rounded-full flex items-center justify-center
              hover:bg-danger transition-colors shadow-md"
          >
            <HiOutlineXMark className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black/20 to-transparent px-3 py-2">
            <div className="flex items-center gap-1.5">
              <HiOutlineCheckCircle className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-medium text-success">Image ready</span>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ── Upload Zone ── */
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer
            transition-all duration-200 select-none
            ${isDragging
              ? "border-primary bg-primary/8 scale-[1.01]"
              : "border-gray-200 bg-gray-50/50 hover:border-primary/50 hover:bg-primary/5"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          style={{ height: 200 }}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
            ${isDragging ? "bg-primary/10" : "bg-gray-100"}`}
          >
            <HiOutlinePhoto className={`w-7 h-7 transition-colors ${isDragging ? "text-primary" : "text-text-muted"}`} />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-text-muted">
              {isDragging ? "Drop image here" : "Click to upload or drag & drop"}
            </p>
            <p className="text-xs text-text-muted/70 mt-1">
              PNG, JPG, WEBP — max {MAX_IMAGE_SIZE_MB}MB
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold">
            <HiOutlineArrowUpTray className="w-3.5 h-3.5" />
            Choose File
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) onFileSelect(file);
          e.target.value = ""; // allow re-selecting same file
        }}
      />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * InventoryModal — Enhanced Add / Edit Inventory Item
 *
 * @param {boolean}     isOpen         - Visibility
 * @param {function}    onClose        - Close callback
 * @param {object|null} existingItem   - Item to edit (null = create new)
 * @param {string}      prefillBarcode - Scanner-provided barcode to pre-fill serial
 */
const InventoryModal = ({ isOpen, onClose, existingItem = null, prefillBarcode = "" }) => {
  const { t, i18n } = useTranslation();
  const { addItem, updateItem } = useInventory();
  const isRTL = i18n.dir(i18n.language) === "rtl";

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [isAutoSerial, setIsAutoSerial] = useState(true);
  const [imageFile,    setImageFile]    = useState(null);
  const [previewUrl,   setPreviewUrl]   = useState(null);
  const [formData,     setFormData]     = useState(EMPTY_FORM);

  // ── Computed alert trigger date (live, updates as user types) ───────────────
  const alertTriggerDate = calculateAlertDate(
    formData.expiration_date,
    parseInt(formData.alert_lead_value) || 0,
    formData.alert_lead_unit
  );

  const alertValidation = validateAlertDate(alertTriggerDate, formData.expiration_date);

  // ── Populate or reset form when modal opens ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (existingItem) {
      const generatedSerial = existingItem.serial_number || String(Math.floor(100000 + Math.random() * 900000));
      setFormData({
        name_en:           existingItem.name_en           || "",
        name_ar:           existingItem.name_ar           || "",
        category_id:       existingItem.category_id       || "",
        category_name_en:  existingItem.category_name_en  || "",
        category_name_ar:  existingItem.category_name_ar  || "",
        trade_name_id:     existingItem.trade_name_id     || "",
        trade_name_en:     existingItem.trade_name_en     || "",
        trade_name_ar:     existingItem.trade_name_ar     || "",
        quantity:          existingItem.total_quantity ?? existingItem.quantity ?? 0,
        serial_number:     generatedSerial,
        production_date:   existingItem.production_date   || "",
        expiration_date:   existingItem.expiration_date   || "",
        minimum_threshold: existingItem.minimum_threshold ?? 5,
        unit_price:        existingItem.unit_price        ?? "",
        merchant_name:     existingItem.merchant_name     || "",
        warehouse_name:    existingItem.warehouse_name    || "",
        warehouse_id:      existingItem.warehouse_id      || "",
        alert_lead_value:  existingItem.alert_lead_value  || "",
        alert_lead_unit:   existingItem.alert_lead_unit   || "days",
      });
      setIsAutoSerial(!existingItem.serial_number);
      setPreviewUrl(existingItem.image_base64 || null);
    } else {
      const generatedSerial = String(Math.floor(100000 + Math.random() * 900000));
      setFormData({ ...EMPTY_FORM, serial_number: prefillBarcode || generatedSerial });
      setIsAutoSerial(!prefillBarcode);
      setPreviewUrl(null);
    }
    setImageFile(null);
    setError("");
  }, [isOpen, existingItem, prefillBarcode]);

  // ── Generic field change handler ────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleAutoSerialToggle = (checked) => {
    setIsAutoSerial(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        serial_number: String(Math.floor(100000 + Math.random() * 900000)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        serial_number: existingItem?.serial_number || "",
      }));
    }
  };

  const handleCategoryChange = (cat) => {
    setFormData((prev) => ({
      ...prev,
      category_id: cat?.category_id || "",
      category_name_en: cat?.category_name_en || "",
      category_name_ar: cat?.category_name_ar || "",
    }));
  };

  const handleTradeNameChange = (trade) => {
    setFormData((prev) => ({
      ...prev,
      trade_name_id: trade?.trade_name_id || "",
      trade_name_en: trade?.trade_name_en || "",
      trade_name_ar: trade?.trade_name_ar || "",
    }));
  };

  // ── Image selection ─────────────────────────────────────────────────────────
  const handleImageSelect = useCallback((file) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(`Image is too large (${formatFileSize(file.size)}). Max ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }
    setError("");
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleImageClear = useCallback(() => {
    setImageFile(null);
    setPreviewUrl(existingItem?.image_base64 || null);
  }, [existingItem]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (!formData.name_en?.trim())
      return t("validation.name_en_required") || "English name is required.";
    if (!formData.name_ar?.trim())
      return t("validation.name_ar_required") || "Arabic name is required.";
    if (!formData.merchant_name?.trim())
      return "Merchant / Supplier name is required.";
    if (!isAutoSerial && formData.serial_number.trim().length < 3)
      return t("validation.serial_min") || "Serial number must be at least 3 characters.";
    if (formData.minimum_threshold < 1)
      return t("validation.threshold_min") || "Low stock threshold must be at least 1.";

    // Unit price validation
    if (!isEdit && (formData.unit_price === "" || Number(formData.unit_price) <= 0))
      return t("validation.price_required") || "Unit price is required for new items.";
    if (formData.unit_price !== "" && (isNaN(Number(formData.unit_price)) || Number(formData.unit_price) < 0))
      return t("validation.price_invalid") || "Price must be a valid number (0 or greater).";

    // Expiry and Alert validation only apply when creating a new item (as they are in Initial Batch)
    if (!isEdit) {
      const leadVal = parseInt(formData.alert_lead_value);
      if (leadVal > 0 && !formData.expiration_date)
        return "An expiry date is required when configuring an alert lead time.";

      if (alertTriggerDate && !alertValidation.valid)
        return alertValidation.warning;
    }

    return null;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");

    try {
      // Compress new image if one was selected
      let image_base64 = existingItem?.image_base64 || null;
      if (imageFile) {
        image_base64 = await compressImage(imageFile, 800, 800, 0.75);
      }
      if (!imageFile && !previewUrl) {
        image_base64 = null;
      }

      const payload = {
        ...formData,
        unit_price: formData.unit_price !== "" ? Number(formData.unit_price) : 0,
        image_base64,
      };

      if (isAutoSerial && !existingItem && !payload.serial_number) {
        payload.serial_number = String(Math.floor(100000 + Math.random() * 900000));
      }

      if (existingItem) {
        // Strip out batch-specific details from the parent doc update payload
        const { production_date, expiration_date, alert_lead_value, alert_lead_unit, quantity, ...updatePayload } = payload;
        await updateItem(existingItem.id, updatePayload);
      } else {
        // Prepare initial batch payload
        const initialBatch = {
          quantity: parseInt(formData.quantity) || 0,
          production_date: formData.production_date || "",
          expiration_date: formData.expiration_date || "",
          alert_lead_value: parseInt(formData.alert_lead_value) || 0,
          alert_lead_unit: formData.alert_lead_unit || "weeks",
        };

        await addItem(payload, initialBatch);
      }

      setLoading(false);
      onClose();
    } catch (err) {
      console.error("[InventoryModal] Save error:", err);
      setError(
        t("errors.save_failed") ||
          "Failed to save changes. Please check your connection."
      );
      setLoading(false);
    }
  };

  const isEdit = !!existingItem;
  const leadVal = parseInt(formData.alert_lead_value) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={isEdit ? t("inventory.modals.edit_title") : t("inventory.modals.add_title")}
      maxWidth="max-w-3xl"
    >
      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-2"
          >
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scanner Prefill Notice ────────────────────────────────────────── */}
      {prefillBarcode && !isEdit && (
        <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-2">
          <HiOutlineQrCode className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-primary font-medium">
            {t("scanner.prefill_notice") || `Barcode "${prefillBarcode}" pre-filled — item not found in inventory.`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-9" noValidate>

        {/* SECTION 1 — Product Image */}
        <fieldset className="flex flex-col gap-7">
          <SectionHeader
            icon={HiOutlinePhoto}
            title="Product Image"
            description="Upload a photo of the product (optional). Stored locally as compressed JPEG."
          />
          <ImageUploadZone
            previewUrl={previewUrl}
            onFileSelect={handleImageSelect}
            onClear={handleImageClear}
            disabled={loading}
          />
        </fieldset>

        <hr className="my-6 border-gray-100" />

        {/* SECTION 2 — Basic Info */}
        <fieldset className="flex flex-col gap-7">
          <SectionHeader
            icon={HiOutlineArchiveBox}
            title={t("inventory.modals.add_title") || "Product Information"}
            description="Names are required in both languages for bilingual reporting."
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="form-label">{t("inventory.modals.name_en")} *</label>
              <input
                name="name_en"
                required
                value={formData.name_en}
                onChange={handleChange}
                dir="ltr"
                autoComplete="off"
                disabled={loading}
                className="form-input"
                placeholder="e.g. Dental Gloves"
              />
            </div>
            <div>
              <label className="form-label">{t("inventory.modals.name_ar")} *</label>
              <input
                name="name_ar"
                required
                value={formData.name_ar}
                onChange={handleChange}
                dir="rtl"
                autoComplete="off"
                disabled={loading}
                className="form-input"
                placeholder="مثال: قفازات طبية"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="form-label">{t("inventory.modals.category_label") || "Category"}</label>
            <CategorySelect
              disabled={loading}
              value={{
                category_id: formData.category_id,
                category_name_en: formData.category_name_en,
                category_name_ar: formData.category_name_ar,
              }}
              onChange={handleCategoryChange}
            />
            <p className="text-xs text-text-muted mt-1">
              {t("inventory.modals.category_hint") || "Search an existing category, or type to create a new one."}
            </p>
          </div>

          {/* Trade Name Selector */}
          <div>
            <label className="form-label">{t("inventory.modals.trade_name_label") || "Trade Name"}</label>
            <TradeNameSelect
              disabled={loading}
              value={{
                trade_name_id: formData.trade_name_id,
                trade_name_en: formData.trade_name_en,
                trade_name_ar: formData.trade_name_ar,
              }}
              onChange={handleTradeNameChange}
            />
            <p className="text-xs text-text-muted mt-1">
              {t("inventory.modals.trade_name_hint") || "Search an existing trade name, or type to create a new one."}
            </p>
          </div>
        </fieldset>

        <hr className="my-6 border-gray-100" />

        {/* SECTION 3 — Stock & Serial */}
        <fieldset className="flex flex-col gap-7">
          <SectionHeader
            icon={HiOutlineQrCode}
            title="Stock & Identification"
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Quantity */}
            <div>
              <label className="form-label">
                {!isEdit ? (isRTL ? "الكمية الأولية للدفعة الأولى" : "Initial Batch Quantity") : t("inventory.modals.quantity")} *
              </label>
              <input
                name="quantity"
                type="number"
                min="0"
                required
                value={formData.quantity}
                onChange={handleChange}
                disabled={loading || isEdit}
                className="form-input"
              />
              {isEdit && (
                <p className="text-xs text-text-muted mt-1">
                  {t("inventory.modals.qty_locked") || "Use IN/OUT transaction to adjust quantity."}
                </p>
              )}
            </div>

            {/* Threshold */}
            <div>
              <label className="form-label">{t("inventory.modals.threshold")} *</label>
              <input
                name="minimum_threshold"
                type="number"
                min="1"
                required
                value={formData.minimum_threshold}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
              />
            </div>

            {/* Serial */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="form-label mb-0">{t("inventory.modals.serial")}</label>
                <label className="text-xs flex items-center gap-1.5 cursor-pointer text-text-muted hover:text-text transition-colors">
                  <input
                    type="checkbox"
                    checked={isAutoSerial}
                    onChange={(e) => handleAutoSerialToggle(e.target.checked)}
                    className="accent-primary"
                    disabled={loading}
                  />
                  {t("inventory.modals.auto_serial")}
                </label>
              </div>
              <input
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                disabled={isAutoSerial || loading}
                className="form-input"
                placeholder={isAutoSerial ? "Auto-generated" : "e.g. 000001"}
              />
            </div>
          </div>

          {/* Unit Price */}
          <div>
            <label className="form-label">{t("inventory.modals.unit_price")}</label>
            <div className="relative">
              <span
                className="absolute top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted select-none pointer-events-none"
                style={{ insetInlineStart: "14px" }}
              >
                {isRTL ? "ج.م" : "EGP"}
              </span>
              <input
                name="unit_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
                style={{ paddingInlineStart: isRTL ? "46px" : "52px" }}
                placeholder={t("inventory.modals.unit_price_placeholder") || "e.g. 150.00"}
              />
            </div>
          </div>
        </fieldset>

        <hr className="my-6 border-gray-100" />

        {/* SECTION 4 — Merchant & Warehouse */}
        <fieldset className="flex flex-col gap-7">
          <SectionHeader
            icon={HiOutlineBuildingStorefront}
            title="Merchant & Warehouse"
            description="Track the product's source and storage location for full supply-chain visibility."
          />

          <div className="grid grid-cols-1 gap-6">
            {/* Merchant Name */}
            <div>
              <label className="form-label">
                Merchant / Supplier Name *
              </label>
              <input
                name="merchant_name"
                required
                value={formData.merchant_name}
                onChange={handleChange}
                disabled={loading}
                autoComplete="organization"
                className="form-input"
                placeholder="e.g. Al-Noor Medical Supplies"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Warehouse Name */}
              <div>
                <label className="form-label">Warehouse Name</label>
                <input
                  name="warehouse_name"
                  value={formData.warehouse_name}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-input"
                  placeholder="e.g. Main Storage Room"
                />
              </div>

              {/* Warehouse ID */}
              <div>
                <label className="form-label">Warehouse Number / ID</label>
                <input
                  name="warehouse_id"
                  value={formData.warehouse_id}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-input"
                  placeholder="e.g. WH-001"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <hr className="my-6 border-gray-100" />

        {/* SECTION 5 — Dates & Expiry Notification or Batch Info note */}
        {!isEdit ? (
          <fieldset className="flex flex-col gap-7">
            <SectionHeader
              icon={HiOutlineCalendarDays}
              title="Initial Batch Details & Expiry Notification"
              description="Set details for the first batch of this product, including expiry dates and alert triggers."
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="form-label">{t("inventory.modals.production")}</label>
                <input
                  name="production_date"
                  type="date"
                  value={formData.production_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">
                  {t("inventory.modals.expiration")}
                  {leadVal > 0 && <span className="text-danger"> *</span>}
                </label>
                <input
                  name="expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-primary/12 bg-primary/4 p-6">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineBell className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-primary">Expiry Alert Lead Time</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  name="alert_lead_value"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.alert_lead_value}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-input w-24 text-center font-bold tabular-nums"
                  placeholder="0"
                />

                <select
                  name="alert_lead_unit"
                  value={formData.alert_lead_unit}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-input flex-1"
                >
                  {LEAD_TIME_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {isRTL ? u.label_ar : u.label}
                    </option>
                  ))}
                </select>

                {leadVal > 0 && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setFormData((p) => ({ ...p, alert_lead_value: "" }))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200
                      text-text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-all"
                    title="Remove alert"
                  >
                    <HiOutlineXMark className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {leadVal > 0 && (
                  <motion.div
                    key="alert-preview"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="mt-4"
                  >
                    {alertTriggerDate ? (
                      <div className={`flex items-start gap-3 p-3 rounded-xl
                        ${alertValidation.valid
                          ? "bg-success/8 border border-success/20"
                          : "bg-danger/8 border border-danger/20"
                        }`}
                      >
                        <HiOutlineCheckCircle className={`w-4 h-4 shrink-0 mt-0.5
                          ${alertValidation.valid ? "text-success" : "text-danger"}`}
                        />
                        <div>
                          <p className="text-xs font-bold text-text">
                            Notification will trigger on:
                          </p>
                          <p className={`text-base font-bold mt-0.5
                            ${alertValidation.valid ? "text-success" : "text-danger"}`}
                          >
                            {formatDisplayDate(alertTriggerDate, isRTL)}
                          </p>
                          {alertValidation.warning && (
                            <p className="text-xs text-warning mt-1 font-medium">
                              {alertValidation.warning}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/8 border border-warning/20">
                        <HiOutlineInformationCircle className="w-4 h-4 text-warning shrink-0" />
                        <p className="text-xs text-warning font-medium">
                          Please set an Expiry Date to calculate the alert trigger date.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {leadVal === 0 && (
                  <motion.p
                    key="alert-hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-text-muted mt-3"
                  >
                    Enter a number above to configure a proactive expiry notification (e.g. "2 Weeks" before expiry).
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </fieldset>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <HiOutlineCalendarDays className="h-5 w-5 text-text-muted" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-muted">
                  {isRTL ? "إدارة الدفعات وتواريخ انتهاء الصلاحية" : "Batch & Expiry Management"}
                </h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {isRTL
                    ? "تواريخ انتهاء صلاحية هذا المنتج تتم إدارتها لكل دفعة على حدة. يرجى استخدام لوحة إدارة الدفعات في صفحة المخزون لضبط الدفعات."
                    : "Expiration dates and stock for this item are tracked at the batch level. Use the Batch Management panel on the main inventory screen to manage them."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            FORM ACTIONS
        ════════════════════════════════════════════════════════════════ */}
        <div className="sticky bottom-0 flex justify-end gap-4 border-t border-gray-100 bg-surface py-5">
          <button
            type="button"
            onClick={loading ? undefined : onClose}
            disabled={loading}
            className="px-6 py-3 text-sm font-semibold text-text-muted
              hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-sm font-semibold text-white
              bg-primary hover:bg-primary-dark rounded-xl shadow-soft
              transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
              min-w-[160px] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
          >
            {loading ? (
              <>
                <span className="spinner animate-spin" style={{ width: 16, height: 16 }} />
                {t("common.saving") || "Saving..."}
              </>
            ) : (
              t("common.save")
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InventoryModal;
