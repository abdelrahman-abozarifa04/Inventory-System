import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Languages,
  Moon,
  Sun,
  LogOut,
  BellRing,
  ShieldCheck,
  Pencil,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import useTheme from "../hooks/useTheme";
import EditProfileModal from "../components/settings/EditProfileModal";
import EditSystemModal from "../components/settings/EditSystemModal";
import Button from "../components/ui/Button";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isRTL = i18n.dir(i18n.language) === "rtl";

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
      setLogoutLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  };

  return (
    <motion.div
      className="mx-auto flex max-w-4xl flex-col gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="mb-2" variants={cardVariants}>
        <h2 className="mb-2 text-2xl font-bold text-text sm:text-3xl">{t("settings.title")}</h2>
        <p className="text-sm text-text-muted">{t("settings.description")}</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        className="bg-surface rounded-2xl shadow-card border border-gray-100 overflow-hidden"
        variants={cardVariants}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/90">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-primary">{t("settings.profile")}</h3>
          </div>
          <Button 
            onClick={() => setIsProfileModalOpen(true)}
            variant="subtle"
            size="sm"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
        <div className="p-10">
          <div className="flex items-center gap-8 mb-10">
            <div className="flex h-24 w-24 items-center overflow-hidden rounded-3xl border-2 border-white/20 bg-gradient-to-br from-primary to-primary-dark text-2xl font-bold text-white shadow-medium">
              {profile?.imageUrl ? (
                <img src={profile.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center">{user?.email?.charAt(0).toUpperCase() || "U"}</span>
              )}
            </div>
            <div>
              <h4 className="font-bold text-text text-xl">{profile?.name || user?.displayName || user?.email}</h4>
              <p className="text-sm text-text-muted">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-highlight/15 text-primary border border-highlight/30">
                {profile?.role || "staff"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs text-text-muted font-medium mb-1">{t("settings.uid")}</p>
              <p className="text-sm font-mono text-text truncate">{user?.uid}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs text-text-muted font-medium mb-1">{t("settings.last_login")}</p>
              <p className="text-sm text-text">
                {user?.metadata?.lastSignInTime
                  ? new Date(user.metadata.lastSignInTime).toLocaleString(isRTL ? "ar-EG" : "en-US")
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preferences Card */}
      <motion.div
        className="bg-surface rounded-2xl shadow-card border border-gray-100 overflow-hidden"
        variants={cardVariants}
      >
        <div className="flex items-center gap-2 px-8 py-5 border-b border-gray-100 bg-gray-50/90">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-primary">{t("settings.preferences")}</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {/* Language */}
          <div className="flex items-center justify-between px-10 py-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-info/10">
                <Languages className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="font-bold text-text text-sm">{t("settings.language")}</p>
                <p className="text-xs text-text-muted">{t("settings.language_desc")}</p>
              </div>
            </div>
            <button
              onClick={toggleLanguage}
              className="h-12 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-soft transition-all hover:bg-primary-dark cursor-pointer"
            >
              {i18n.language === "en" ? "العربية" : "English"}
            </button>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between px-10 py-8">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-3xl ${theme === "dark" ? "bg-warning/10" : "bg-primary/10"}`}>
                {theme === "dark" ? <Sun className="h-5 w-5 text-warning" /> : <Moon className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <p className="font-medium text-text text-sm">{t("settings.theme")}</p>
                <p className="text-xs text-text-muted">{t("settings.theme_desc")}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="h-12 rounded-xl bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              {theme === "dark" ? t("settings.theme_light") : t("settings.theme_dark")}
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between px-10 py-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-warning/10">
                <BellRing className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-text text-sm">{t("settings.notifications")}</p>
                <p className="text-xs text-text-muted">{t("settings.notifications_desc")}</p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-success/10 text-success border border-success/20">
              {t("settings.enabled")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* System Info Card */}
      <motion.div
        className="bg-surface rounded-2xl shadow-card border border-gray-100 overflow-hidden"
        variants={cardVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/90">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-primary">{t("settings.system")}</h3>
          </div>
          <Button 
            onClick={() => setIsSystemModalOpen(true)}
            variant="subtle"
            size="sm"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
        <div className="p-10">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 text-center">
              <p className="text-xs text-text-muted mb-1">{t("settings.version")}</p>
              <p className="text-sm font-bold text-text">1.0.0</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 text-center">
              <p className="text-xs text-text-muted mb-1">{t("settings.backend")}</p>
              <p className="text-sm font-bold text-success">Firebase</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 text-center">
              <p className="text-xs text-text-muted mb-1">{t("settings.status")}</p>
              <p className="text-sm font-bold text-success flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {t("settings.online")}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div variants={cardVariants}>
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="flex w-full items-center justify-center gap-2 rounded-3xl py-5
            bg-danger/10 text-danger font-semibold hover:bg-danger/20 border border-danger/20
            transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {logoutLoading ? (
            <span className="w-5 h-5 border-2 border-danger/30 border-t-danger rounded-full animate-spin" />
          ) : (
            <>
              <LogOut className="h-5 w-5" />
              {t("settings.logout")}
            </>
          )}
        </button>
      </motion.div>
      
      <EditProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <EditSystemModal isOpen={isSystemModalOpen} onClose={() => setIsSystemModalOpen(false)} />
    </motion.div>
  );
};

export default Settings;
