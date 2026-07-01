import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import useToast from "../../hooks/useToast";
import { cn } from "../../lib/utils";

const toastIcons = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  info: <Info className="h-5 w-5 text-primary" />,
};

const toastStyles = {
  success: "bg-success/8 border-success/25",
  error: "bg-danger/8 border-danger/25",
  warning: "bg-warning/8 border-warning/25",
  info: "bg-primary/8 border-primary/20",
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 z-[999] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 pointer-events-none end-4 sm:bottom-6 sm:end-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface/95 px-4 py-3 shadow-medium backdrop-blur-md",
              toastStyles[toast.type]
            )}
          >
            <div className="shrink-0 mt-0.5">{toastIcons[toast.type]}</div>
            <p className="flex-1 text-sm font-medium leading-snug text-text">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="-me-1.5 -mt-1.5 shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
