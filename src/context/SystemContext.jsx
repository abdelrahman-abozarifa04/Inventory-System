import { createContext, useState, useEffect, useContext } from "react";
import { onSnapshot } from "firebase/firestore";
import { getTenantSettingsDoc } from "../config/dbConfig";

export const SystemContext = createContext();

/**
 * SystemProvider — reads /tenants/{tenantId}/settings/system in real-time.
 * Requires tenantId to be injected from AuthContext (via App.jsx structure).
 * Falls back gracefully to defaults when tenantId is null (pre-onboarding).
 */
export const SystemProvider = ({ tenantId, children }) => {
  const [systemSettings, setSystemSettings] = useState({
    name_en:            "Makhzani",
    name_ar:            "مخزني",
    logoUrl:            null,
    storeType:          "general",
    currency:           "EGP",
    currencySymbol:     "ج.م",
    timezone:           "Africa/Cairo",
    lowStockThreshold:  5,
    expiryAlertDays:    30,
    primaryColor:       "#0891b2",
    address:            "",
    phone:              "",
    email:              "",
  });
  const [systemLoading, setSystemLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setSystemLoading(false);
      return;
    }

    const docRef = getTenantSettingsDoc(tenantId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setSystemSettings((prev) => ({ ...prev, ...snap.data() }));
        }
        setSystemLoading(false);
      },
      (err) => {
        console.error("[SystemContext] error:", err);
        setSystemLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  return (
    <SystemContext.Provider value={{ systemSettings, setSystemSettings, systemLoading }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error("useSystem must be used within a SystemProvider");
  return ctx;
};

export default useSystem;
