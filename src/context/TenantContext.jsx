import { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { getTenantSettingsDoc } from "../config/dbConfig";

export const TenantContext = createContext(null);

/**
 * TenantProvider — wraps the app and provides:
 *   - tenantId          : string (the tenant's Firestore ID)
 *   - tenantSettings    : object (name, logo, currency, storeType, etc.)
 *   - subscription      : object (status, plan, endDate, trialEnd)
 *   - subscriptionStatus: "active" | "trial" | "expired" | "cancelled" | "none"
 *   - isSubscriptionValid: boolean (true if active or trial)
 *   - updateTenantSettings: async function
 *   - tenantLoading     : boolean
 *
 * @param {string} tenantId   - Passed down from AuthContext once user loads
 * @param {ReactNode} children
 */
export const TenantProvider = ({ tenantId, children }) => {
  const [tenantSettings, setTenantSettings] = useState({
    name_en: "My Store",
    name_ar: "متجري",
    logoUrl: null,
    storeType: "general",
    currency: "EGP",
    currencySymbol: "ج.م",
    timezone: "Africa/Cairo",
    lowStockThreshold: 5,
    expiryAlertDays: 30,
    primaryColor: "#0891b2",
  });
  const [subscription, setSubscription] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(true);

  // ── Listen to tenant settings doc ─────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) {
      setTenantLoading(false);
      return;
    }

    const settingsRef = getTenantSettingsDoc(tenantId);
    const unsubSettings = onSnapshot(
      settingsRef,
      (snap) => {
        if (snap.exists()) {
          setTenantSettings((prev) => ({ ...prev, ...snap.data() }));
        }
        setTenantLoading(false);
      },
      (err) => {
        console.error("[TenantContext] settings error:", err);
        setTenantLoading(false);
      }
    );

    return () => unsubSettings();
  }, [tenantId]);

  // ── Listen to subscription doc ─────────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;

    const subRef = doc(db, `tenants/${tenantId}/subscription/active`);
    const unsubSub = onSnapshot(
      subRef,
      (snap) => {
        if (snap.exists()) {
          setSubscription(snap.data());
        } else {
          setSubscription(null);
        }
      },
      (err) => {
        console.error("[TenantContext] subscription error:", err);
      }
    );

    return () => unsubSub();
  }, [tenantId]);

  // ── Derive subscription status ─────────────────────────────────────────────
  const subscriptionStatus = (() => {
    if (!subscription) return "none";
    const { status, trialEnd, endDate } = subscription;

    if (status === "trial") {
      const now = new Date();
      const end = trialEnd?.toDate ? trialEnd.toDate() : new Date(trialEnd);
      return now <= end ? "trial" : "expired";
    }
    if (status === "active") {
      const now = new Date();
      const end = endDate?.toDate ? endDate.toDate() : new Date(endDate);
      return now <= end ? "active" : "expired";
    }
    return status || "none"; // "cancelled", "expired"
  })();

  const isSubscriptionValid =
    subscriptionStatus === "active" || subscriptionStatus === "trial";

  // ── Days remaining in trial ────────────────────────────────────────────────
  const trialDaysRemaining = (() => {
    if (subscriptionStatus !== "trial" || !subscription?.trialEnd) return 0;
    const end = subscription.trialEnd?.toDate
      ? subscription.trialEnd.toDate()
      : new Date(subscription.trialEnd);
    const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  })();

  // ── Update tenant settings ─────────────────────────────────────────────────
  const updateTenantSettings = async (updates) => {
    if (!tenantId) throw new Error("No tenant ID");
    const settingsRef = getTenantSettingsDoc(tenantId);
    await setDoc(settingsRef, { ...updates, updated_at: serverTimestamp() }, { merge: true });
    setTenantSettings((prev) => ({ ...prev, ...updates }));
  };

  // ── Initialise trial subscription for brand-new tenants ───────────────────
  const initTenantSubscription = async () => {
    if (!tenantId) throw new Error("No tenant ID");
    const subRef = doc(db, `tenants/${tenantId}/subscription/active`);
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial

    await setDoc(subRef, {
      tenantId,
      status: "trial",
      plan: "starter",
      trialEnd,
      startDate: serverTimestamp(),
      endDate: trialEnd,
      paymentMethod: null,
      createdAt: serverTimestamp(),
    });
  };

  const value = {
    tenantId,
    tenantSettings,
    subscription,
    subscriptionStatus,
    isSubscriptionValid,
    trialDaysRemaining,
    tenantLoading,
    updateTenantSettings,
    initTenantSubscription,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within a TenantProvider");
  return ctx;
};

export default useTenant;
