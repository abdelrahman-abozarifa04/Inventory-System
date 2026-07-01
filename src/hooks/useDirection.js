import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Custom hook that synchronizes the document's `dir` and `lang` attributes
 * with the current i18n language. Ensures proper RTL/LTR layout switching
 * when the user toggles between Arabic and English.
 */
const useDirection = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.dir(i18n.language);
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;

    // Update font family for Arabic
    if (i18n.language === "ar") {
      document.documentElement.style.fontFamily = "'Noto Kufi Arabic', 'Inter', sans-serif";
    } else {
      document.documentElement.style.fontFamily = "'Inter', sans-serif";
    }
  }, [i18n, i18n.language]);

  return {
    isRTL: i18n.dir(i18n.language) === "rtl",
    currentLang: i18n.language,
    direction: i18n.dir(i18n.language),
  };
};

export default useDirection;
