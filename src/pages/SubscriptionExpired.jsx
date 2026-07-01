import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CreditCard, LogOut } from "lucide-react";
import useAuth from "../hooks/useAuth";

const SubscriptionExpired = () => {
  const { t, i18n } = useTranslation();
  const isRTL       = i18n.language === "ar";
  const navigate    = useNavigate();
  const { logout }  = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          {isRTL ? "انتهت صلاحية الاشتراك" : "Subscription Expired"}
        </h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          {isRTL
            ? "اشتراكك انتهى. جدّد اشتراكك عشان تقدر تستخدم النظام تاني. بياناتك آمنة ومحفوظة."
            : "Your subscription has expired. Renew to continue using the system. Your data is safe and preserved."}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/billing")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all"
          >
            <CreditCard className="w-5 h-5" />
            {isRTL ? "جدّد الاشتراك" : "Renew Subscription"}
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <LogOut className="w-4 h-4" />
            {isRTL ? "تسجيل خروج" : "Log Out"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
