import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

/**
 * Custom hook to easily trigger global toast notifications
 * Returns { addToast, removeToast, toasts }
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default useToast;
