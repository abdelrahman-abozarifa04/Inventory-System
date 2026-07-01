import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTenant } from "../../context/TenantContext";
import { useAuth } from "../../context/AuthContext";

/**
 * SubscriptionGuard
 *
 * Behaviour matrix:
 *   • No auth user            → do nothing (ProtectedRoute handles redirect)
 *   • Authenticated, no tenant → redirect to /onboarding
 *   • Trial, days left        → show trial banner, allow access
 *   • Trial, expired          → redirect to /subscription-expired
 *   • Active                  → pass-through
 *   • Expired / Cancelled     → redirect to /subscription-expired
 *   • status === "none"       → redirect to /onboarding (no subscription yet)
 */
const TRIAL_BANNER_ROUTES_EXEMPT = ["/onboarding", "/billing", "/plans", "/subscription-expired"];

export const SubscriptionGuard = ({ children }) => {
  const { user, tenantId } = useAuth();
  const { subscriptionStatus, trialDaysRemaining, tenantLoading } = useTenant();
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!user || tenantLoading) return;

    // No tenant → onboarding
    if (!tenantId && !TRIAL_BANNER_ROUTES_EXEMPT.includes(pathname)) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Expired / cancelled → expired page (unless already there)
    if (
      tenantId &&
      (subscriptionStatus === "expired" || subscriptionStatus === "cancelled") &&
      !TRIAL_BANNER_ROUTES_EXEMPT.includes(pathname)
    ) {
      navigate("/subscription-expired", { replace: true });
      return;
    }
  }, [user, tenantId, subscriptionStatus, tenantLoading, navigate, pathname]);

  // Trial banner
  const showTrialBanner =
    subscriptionStatus === "trial" &&
    !TRIAL_BANNER_ROUTES_EXEMPT.includes(pathname);

  return (
    <>
      {showTrialBanner && (
        <div
          className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-3 py-2 px-4 text-sm font-medium bg-amber-500 text-amber-950"
          role="alert"
        >
          <span>⏳</span>
          <span>
            الفترة التجريبية — باقي{" "}
            <strong>{trialDaysRemaining} {trialDaysRemaining === 1 ? "يوم" : "أيام"}</strong>.{" "}
            <button
              onClick={() => navigate("/billing")}
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              اشترك الآن
            </button>
          </span>
        </div>
      )}
      <div className={showTrialBanner ? "pt-9" : ""}>{children}</div>
    </>
  );
};

export default SubscriptionGuard;
