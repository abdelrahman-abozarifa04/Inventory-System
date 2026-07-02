import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";

/**
 * Reusable Animated Modal Component
 *
 * Three-part layout: Header (sticky) → Body (scrollable) → Footer (sticky).
 * Accepts an optional `footer` prop for action buttons so they never get
 * clipped by the scroll container.
 *
 * Dark-mode aware through CSS variable usage.
 */
const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = "max-w-md" }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir(i18n.language) === "rtl";

  // Prevent background scrolling when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal Container — mobile: start from top; sm+: vertically centered */}
          <div className="fixed inset-0 z-[61] flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4 pointer-events-none overflow-y-auto">
            <motion.div
              className={cn(
                "flex w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-surface shadow-medium pointer-events-auto",
                "max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-4rem)]",
                maxWidth
              )}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              {/* Header — always visible */}
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-surface px-7 py-5">
                <h3 className="text-base font-bold text-text sm:text-lg">{title}</h3>
                <button
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
                  aria-label={isRTL ? "إغلاق" : "Close"}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0 p-7 sm:p-8">
                {children}
              </div>

              {/* Footer — always visible, pinned at bottom */}
              {footer && (
                <div className="shrink-0 border-t border-gray-100 bg-surface px-7 py-5">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
