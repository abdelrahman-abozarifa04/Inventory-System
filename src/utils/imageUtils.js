/**
 * imageUtils.js — Shared Image Compression Utility
 *
 * Extracted from EditProfileModal & EditSystemModal (DRY principle).
 * Used by InventoryModal, EditProfileModal, EditSystemModal.
 *
 * Resizes and compresses an image File to a base64 JPEG data URI
 * suitable for storing directly in Firestore as a string field.
 *
 * @param {File}   file      - The raw File object from <input type="file">
 * @param {number} maxWidth  - Max pixel width of output (default: 800)
 * @param {number} maxHeight - Max pixel height of output (default: 800)
 * @param {number} quality   - JPEG quality 0–1 (default: 0.75)
 * @returns {Promise<string>} - Resolves to a base64 data URI string
 */
export const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onerror = () => reject(new Error("Failed to read image file."));

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onerror = () => reject(new Error("Failed to decode image."));

      img.onload = () => {
        let { width, height } = img;

        // Proportional scale-down — never upscale
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    };
  });
};

/**
 * formatFileSize — Human-readable file size string
 * @param {number} bytes
 * @returns {string} e.g. "1.4 MB"
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};
