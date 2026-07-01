import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { HiOutlineGlobeAlt } from "react-icons/hi2";

/**
 * Language Toggle Button
 * Switches between Arabic (RTL) and English (LTR).
 *
 * When `compact` is true (Navbar context), uses dark-on-light styling
 * so it is visible against the glassmorphism header.
 * When `compact` is false (Login page, etc.), uses light-on-dark styling.
 */
const LanguageToggle = ({ compact = false }) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <motion.button
      id="language-toggle-btn"
      onClick={toggleLanguage}
      className={`
        relative flex items-center gap-2 
        rounded-full font-semibold
        transition-all duration-300 cursor-pointer
        ${
          compact
            ? "h-11 px-5 py-3 text-xs bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/10 text-text hover:text-primary-light shadow-sm hover:shadow-md hover:border-primary/20"
            : "h-12 px-6 py-3 text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-highlight/50 backdrop-blur-md shadow-lg"
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={t("language.toggle")}
    >
      <motion.div
        animate={{ rotate: i18n.language === "ar" ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <HiOutlineGlobeAlt className="w-4 h-4" />
      </motion.div>

      <motion.span
        key={i18n.language}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className="leading-none"
      >
        {t("language.toggle")}
      </motion.span>

      {/* Active language indicator dot */}
      <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-highlight shadow-[0_0_8px_rgba(13,255,241,0.6)]" />
    </motion.button>
  );
};

export default LanguageToggle;
