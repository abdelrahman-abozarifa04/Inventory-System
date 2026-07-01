import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineUser, HiOutlineArrowUpTray } from "react-icons/hi2";
import useAuth from "../../hooks/useAuth";
import Modal from "../ui/Modal";
import { compressImage } from "../../utils/imageUtils";

const EditProfileModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, profile, updateProfileInfo } = useAuth();
  
  const [name, setName] = useState(profile?.name || user?.displayName || "");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(profile?.imageUrl || null);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef(null);

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
      let imageUrl = profile?.imageUrl || null;
      
      if (imageFile) {
        imageUrl = await compressImage(imageFile);
      }

      await updateProfileInfo({
        name,
        ...(imageUrl && { imageUrl })
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Profile Image */}
        <div className="mb-2 flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary bg-primary/10 flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <HiOutlineUser className="w-10 h-10 text-primary" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-12 items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-primary transition-colors hover:text-primary-dark cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
          >
            <HiOutlineArrowUpTray className="w-4 h-4" />
            Upload Image
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Name */}
        <div>
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter your name"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : "Save Changes"}
        </button>
      </form>
    </Modal>
  );
};

export default EditProfileModal;
