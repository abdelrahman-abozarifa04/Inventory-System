import { useTranslation } from "react-i18next";
import { useTenant } from "../context/TenantContext";
import { CreditCard, Calendar, Clock, Shield, ExternalLink } from "lucide-react";

/**
 * Billing page — shows current subscription info.
 * Paymob integration will be wired here once the merchant account is ready.
 */
const Billing = () => {
  const { t, i18n }     = useTranslation();
  const isRTL            = i18n.language === "ar";
  const { subscription, subscriptionStatus, trialDaysRemaining, tenantSettings } = useTenant();

  const STATUS_LABEL = {
    active:    { en: "Active",    ar: "نشط",      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    trial:     { en: "Free Trial", ar: "فترة تجريبية", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    expired:   { en: "Expired",   ar: "منتهي",     color: "bg-red-500/10 text-red-400 border-red-500/30" },
    cancelled: { en: "Cancelled", ar: "ملغي",      color: "bg-gray-500/10 text-gray-400 border-gray-500/30" },
    none:      { en: "No Plan",   ar: "بدون خطة",  color: "bg-gray-500/10 text-gray-400 border-gray-500/30" },
  };

  const s = STATUS_LABEL[subscriptionStatus] || STATUS_LABEL.none;

  const formatDate = (d) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d?.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString(isRTL ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isRTL ? "الفواتير والاشتراك" : "Billing & Subscription"}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{isRTL ? "إدارة خطة الاشتراك والمدفوعات" : "Manage your subscription plan and payments"}</p>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isRTL ? "خطة الاشتراك الحالية" : "Current Plan"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{subscription?.plan || "starter"}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${s.color}`}>
            {isRTL ? s.ar : s.en}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">{isRTL ? "تاريخ البداية" : "Start Date"}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(subscription?.startDate)}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{isRTL ? "تاريخ الانتهاء" : "End Date"}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(subscription?.endDate || subscription?.trialEnd)}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">{isRTL ? "بوابة الدفع" : "Payment Gateway"}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Paymob</p>
          </div>
        </div>

        {/* Trial Banner */}
        {subscriptionStatus === "trial" && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <span className="text-sm text-amber-300">
              ⏳ {isRTL ? `باقي ${trialDaysRemaining} أيام في الفترة التجريبية` : `${trialDaysRemaining} days left in trial`}
            </span>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
              {isRTL ? "اشترك الآن" : "Upgrade Now"}
            </button>
          </div>
        )}
      </div>

      {/* Paymob Integration Placeholder */}
      <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{isRTL ? "طرق الدفع" : "Payment Methods"}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{isRTL ? "ادفع ببطاقة فيزا/ماستركارد أو فوري عبر Paymob" : "Pay with Visa/Mastercard or Fawry via Paymob"}</p>

        <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CreditCard className="w-8 h-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{isRTL ? "ربط بوابة Paymob" : "Connect Paymob Gateway"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{isRTL ? "هيتم تفعيلها بعد إعداد Merchant Account" : "Will be activated after merchant account setup"}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 ms-auto" />
        </div>
      </div>
    </div>
  );
};

export default Billing;
