import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import useAlertSync from "../../hooks/useAlertSync";

/**
 * AppShell Component
 * Main layout wrapper that composes Sidebar + Navbar + Content area.
 * Uses CSS logical properties for automatic RTL/LTR adaptation.
 * Responsive: sidebar collapses on mobile to an overlay drawer.
 */
const AppShell = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useAlertSync();

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar
          onMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
          isMobileOpen={isMobileOpen}
        />

        {/* Page Content */}
        <motion.main
          className="flex-1 overflow-y-auto overflow-x-hidden bg-pattern px-4 py-10 sm:px-6 lg:px-10 lg:py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default AppShell;
