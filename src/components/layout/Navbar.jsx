import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LanguageToggle from "../ui/LanguageToggle";
import useAlerts from "../../hooks/useAlerts";
import useTheme from "../../hooks/useTheme";
import useAuth from "../../hooks/useAuth";

/**
 * Navbar Component
 * Glassmorphism top bar with search, notifications, language toggle,
 * dark mode toggle, and user avatar. Responsive with mobile hamburger support.
 */
const Navbar = ({ onMenuToggle, isMobileOpen }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { unreadCount } = useAlerts();
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <motion.header
      className="sticky top-4 z-20 mx-4 my-2 rounded-2xl border border-border bg-surface-glass backdrop-blur-xl shadow-soft overflow-hidden"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex h-[72px] items-center justify-between px-6 sm:px-8">
        {/* Left Section: Mobile Menu + Page Title */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <motion.button
            className="flex h-11 w-11 items-center justify-center rounded-xl
              bg-primary/10 text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50 lg:hidden"
            onClick={onMenuToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isMobileOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Greeting */}
          <div className="hidden sm:block">
            <motion.p
              className="text-sm text-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {t("navbar.greeting")}
            </motion.p>
          </div>
        </div>

        {/* Right Section: Search + Notifications + Theme + Language + Profile */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Search */}
          <div className="relative flex items-center">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.input
                  ref={searchRef}
                  id="navbar-search-input"
                  type="text"
                  placeholder={t("navbar.search")}
                  className="absolute end-12 h-11 w-48 rounded-xl px-4 sm:w-64
                    bg-surface border border-gray-200
                    text-sm text-text placeholder:text-text-muted
                    focus:outline-none focus:ring-2 focus:ring-highlight/40 focus:border-highlight/40
                    transition-all"
                  initial={{ width: 0, opacity: 0, scaleX: 0 }}
                  animate={{ width: "auto", opacity: 1, scaleX: 1 }}
                  exit={{ width: 0, opacity: 0, scaleX: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onBlur={() => setIsSearchOpen(false)}
                />
              )}
            </AnimatePresence>

            <motion.button
              id="navbar-search-btn"
              className="flex h-11 w-11 items-center justify-center rounded-xl
                bg-primary/5 hover:bg-primary/10 text-text-muted hover:text-primary
                transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/40"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t("navbar.search")}
            >
              <Search className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Notifications */}
          <motion.button
            id="navbar-notifications-btn"
            onClick={() => navigate('/alerts')}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl
              bg-primary/5 hover:bg-primary/10 text-text-muted hover:text-primary
              transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t("navbar.notifications")}
          >
            <motion.div
              animate={unreadCount > 0 ? {
                rotate: [0, -10, 10, -10, 10, 0],
              } : {}}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 4,
              }}
            >
              <Bell className="h-5 w-5" />
            </motion.div>

            {/* Notification badge */}
            {unreadCount > 0 && (
              <motion.span
                className="absolute -top-0.5 -end-0.5 flex items-center justify-center
                  min-w-[18px] h-[18px] px-1 rounded-full
                  bg-danger text-white text-[10px] font-bold
                  shadow-[0_2px_8px_rgba(239,68,68,0.4)]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.5 }}
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          {/* Dark / Light Mode Toggle */}
          <motion.button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-xl
              bg-primary/5 hover:bg-primary/10 text-text-muted hover:text-primary
              transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t("navbar.theme_toggle") || "Toggle theme"}
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-5 w-5 text-warning" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Language Toggle */}
          <LanguageToggle compact />

          {/* User Avatar */}
          <motion.button
            id="navbar-profile-btn"
            onClick={() => navigate('/settings')}
            className="flex h-11 w-11 items-center justify-center rounded-xl
              bg-primary
              text-white text-sm font-bold overflow-hidden
              shadow-soft transition-shadow hover:shadow-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t("navbar.profile")}
          >
            {profile?.imageUrl ? (
              <img src={profile.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.email?.charAt(0).toUpperCase() || "U"}</span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
