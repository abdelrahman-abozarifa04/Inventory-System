import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineArrowUpTray, HiOutlineBuildingOffice } from "react-icons/hi2";
import useSystem from "../../context/SystemContext";
import Modal from "../ui/Modal";
import { compressImage } from "../../utils/imageUtils";

const EditSystemModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { systemSettings, updateSystemSettings } = useSystem();
  
  const [nameEn, setNameEn] = useState(systemSettings?.name_en || "");
  const [nameAr, setNameAr] = useState(systemSettings?.name_ar || "");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(systemSettings?.logoUrl || null);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNameEn(systemSettings?.name_en || "");
      setNameAr(systemSettings?.name_ar || "");
      setPreviewUrl(systemSettings?.logoUrl || null);
    }
  }, [isOpen, systemSettings]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let logoUrl = systemSettings?.logoUrl || null;
      
      if (imageFile) {
        logoUrl = await compressImage(imageFile);
      }

      await updateSystemSettings({
        name_en: nameEn,
        name_ar: nameAr,
        ...(logoUrl && { logoUrl })
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating system settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit System Settings"
      footer={
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-sm font-semibold text-text-muted hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="submit"
            form="edit-system-form"
            disabled={loading}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50 min-w-[140px]"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : t("common.save", "Save Settings")}
          </button>
        </div>
      }
    >
      <form id="edit-system-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Logo Image */}
        <div className="mb-2 flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary bg-primary/10 flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="System Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <HiOutlineBuildingOffice className="w-10 h-10 text-primary" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-12 items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-primary transition-colors hover:text-primary-dark cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
          >
            <HiOutlineArrowUpTray className="w-4 h-4" />
            Upload Logo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* English Name */}
        <div>
          <label className="form-label flex items-center gap-2">
            System Name (English)
          </label>
          <input
            type="text"
            className="form-input"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
            placeholder="e.g. Dental Clinic"
          />
        </div>

        {/* Arabic Name */}
        <div>
          <label className="form-label flex items-center gap-2">
            System Name (Arabic)
          </label>
          <input
            type="text"
            className="form-input text-right"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            dir="rtl"
            required
            placeholder="مثال: عيادة الأسنان"
          />
        </div>

      </form>
    </Modal>
  );
};

export default EditSystemModal;
