import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  CreditCard,
} from "lucide-react";
import useSystem from "../../context/SystemContext";

/**
 * Sidebar Component
 * Collapsible sidebar with animated navigation items,
 * active route indicator with highlight glow, and gradient background.
 */
const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isRTL = i18n.dir(i18n.language) === "rtl";
  const { systemSettings } = useSystem();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: t("sidebar.dashboard") },
    { path: "/inventory", icon: Package, label: t("sidebar.inventory") },
    { path: "/transactions", icon: ArrowRightLeft, label: t("sidebar.transactions") },
    { path: "/alerts", icon: Bell, label: t("sidebar.alerts") },
    { path: "/billing", icon: CreditCard, label: t("sidebar.billing") },
    { path: "/settings", icon: Settings, label: t("sidebar.settings") },
  ];

  const sidebarVariants = {
    expanded: { width: 276 },
    collapsed: { width: 80 },
  };

  const mobileOverlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 },
  };

  const mobileSidebarVariants = {
    open: { x: 0 },
    closed: { x: isRTL ? 288 : -288 },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: isRTL ? 20 : -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 },
    }),
  };

  const CollapseIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose;

  const renderNavContent = (mobile = false) => (
    <nav className="mt-4 flex flex-col gap-2.5 px-3">
      {navItems.map((item, index) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        const showLabel = mobile || !isCollapsed;

        return (
          <motion.div
            key={item.path}
            custom={index}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <NavLink
              to={item.path}
              onClick={() => mobile && setIsMobileOpen(false)}
              className={`
                group relative flex items-center gap-3.5
                rounded-xl px-5 py-3.5 text-sm font-medium
                transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50
                ${isActive
                  ? "bg-highlight/12 text-white border border-highlight/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                }
                ${!showLabel ? "justify-center" : ""}
              `}
            >
              {/* Active indicator bar */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId={mobile ? "mobile-active" : "sidebar-active"}
                    className="absolute inset-y-3 start-0 w-1 rounded-full bg-highlight"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    exit={{ scaleY: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              <Icon className={`h-5 w-5 shrink-0 transition-colors duration-200 ${isActive ? "text-highlight" : "text-white/70 group-hover:text-white"}`} />

              <AnimatePresence mode="wait">
                {showLabel && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {!showLabel && (
                <div className={`
                  absolute ${isRTL ? "end-full me-3" : "start-full ms-3"} 
                  px-3 py-1.5 rounded-lg
                  bg-surface text-text text-xs font-medium
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity duration-200 whitespace-nowrap z-50
                  shadow-medium border border-gray-100
                `}>
                  {item.label}
                </div>
              )}
            </NavLink>
          </motion.div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar — Premium Floating Clinical Card */}
      <motion.aside
        className="relative z-30 hidden h-[calc(100vh-32px)] shrink-0 flex-col rounded-2xl border border-white/8 my-4 ms-4 sidebar-gradient shadow-medium overflow-hidden lg:flex"
        variants={sidebarVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Logo / Brand */}
        <div className={`flex items-center gap-3 px-6 pb-6 pt-6 ${isCollapsed ? "justify-center px-3" : ""}`}>
          <motion.div
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10"
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {systemSettings?.logoUrl ? (
              <img src={systemSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Package className="h-5 w-5 text-highlight" />
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-sm font-bold leading-tight text-white">
                  {isRTL ? systemSettings.name_ar : systemSettings.name_en}
                </h1>
                <p className="text-xs text-white/50">{t("sidebar.subtitle")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-2 h-px bg-white/10" />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {renderNavContent(false)}
        </div>

        {/* Collapse Button */}
        <div className="border-t border-white/10 p-3">
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-center rounded-xl py-3.5
              text-white/50 transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
              transition-all duration-200 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={t("sidebar.collapse")}
          >
            <CollapseIcon className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
          </motion.button>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              variants={mobileOverlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setIsMobileOpen(false)}
            />

            <motion.aside
              className="fixed top-4 bottom-4 start-4 z-50 flex h-[calc(100vh-32px)] w-[280px] flex-col rounded-2xl border border-white/10 sidebar-gradient shadow-2xl overflow-hidden lg:hidden"
              variants={mobileSidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Mobile Brand */}
              <div className="flex items-center gap-3 px-6 pb-6 pt-6">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10">
                  {systemSettings?.logoUrl ? (
                    <img src={systemSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-5 w-5 text-highlight" />
                  )}
                </div>
                <div>
                  <h1 className="text-white font-bold text-sm leading-tight">
                    {isRTL ? systemSettings.name_ar : systemSettings.name_en}
                  </h1>
                  <p className="text-white/50 text-xs">{t("sidebar.subtitle")}</p>
                </div>
              </div>

              <div className="mx-4 h-px bg-white/10 mb-2" />

              <div className="flex-1 overflow-y-auto py-2">
                {renderNavContent(true)}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
