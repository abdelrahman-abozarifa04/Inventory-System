import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Check, Package } from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name_en: "Starter", name_ar: "أساسي",
    prices: { monthly: 9, quarterly: 24, semi_annual: 45, annual: 79 },
    features_en: ["200 Products", "1 User", "Barcode Scanner", "Basic Reports", "Email Support"],
    features_ar: ["200 منتج", "مستخدم واحد", "ماسح باركود", "تقارير أساسية", "دعم بالبريد"],
    color: "cyan",
  },
  {
    id: "pro",
    name_en: "Pro", name_ar: "احترافي",
    prices: { monthly: 19, quarterly: 49, semi_annual: 89, annual: 149 },
    features_en: ["2,000 Products", "5 Users", "Smart Alerts", "Advanced Reports", "Batch System", "6-month History", "Email + Chat Support", "Custom Branding"],
    features_ar: ["2,000 منتج", "5 مستخدمين", "تنبيهات ذكية", "تقارير متقدمة", "نظام الدفعات", "سجل 6 شهور", "دعم بريد + شات", "علامة تجارية مخصصة"],
    color: "violet",
    popular: true,
  },
  {
    id: "enterprise",
    name_en: "Enterprise", name_ar: "مؤسسي",
    prices: { monthly: 39, quarterly: 99, semi_annual: 179, annual: 299 },
    features_en: ["Unlimited Products", "Unlimited Users", "Full History", "API Access", "Priority + Phone Support", "Export & Advanced Analytics"],
    features_ar: ["منتجات غير محدودة", "مستخدمين غير محدودين", "سجل كامل", "وصول API", "دعم أولوية + هاتف", "تصدير وتحليلات متقدمة"],
    color: "amber",
  },
];

const COLOR_MAP = {
  cyan:   { bg: "bg-cyan-500/10",   border: "border-cyan-500/40",   btn: "from-cyan-600 to-cyan-500",   text: "text-cyan-400",   shadow: "shadow-cyan-500/20" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/40", btn: "from-violet-600 to-violet-500", text: "text-violet-400", shadow: "shadow-violet-500/20" },
  amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/40",  btn: "from-amber-600 to-amber-500",  text: "text-amber-400",  shadow: "shadow-amber-500/20" },
};

const Plans = () => {
  const { t, i18n } = useTranslation();
  const isRTL       = i18n.language === "ar";
  const navigate    = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-cyan-950 py-16 px-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/25 mb-4">
          <Package className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{isRTL ? "اختر خطتك" : "Choose Your Plan"}</h1>
        <p className="text-gray-400 max-w-md mx-auto">{isRTL ? "ابدأ بفترة تجريبية 7 أيام مجاناً — بدون بطاقة ائتمان" : "Start with a 7-day free trial — no credit card required"}</p>
      </div>

      {/* Plan Cards */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const c = COLOR_MAP[plan.color];
          const features = isRTL ? plan.features_ar : plan.features_en;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 ${plan.popular ? c.border : "border-gray-800/60"} ${plan.popular ? c.bg : "bg-gray-900/80"} backdrop-blur-xl p-7 flex flex-col transition-all hover:scale-[1.02]`}
            >
              {plan.popular && (
                <div className={`absolute -top-3 inset-x-0 mx-auto w-fit px-4 py-1 rounded-full text-xs font-bold ${c.text} bg-gray-900 border ${c.border}`}>
                  {isRTL ? "⭐ الأكثر شعبية" : "⭐ Most Popular"}
                </div>
              )}

              <h3 className={`text-xl font-bold ${c.text} mb-1`}>{isRTL ? plan.name_ar : plan.name_en}</h3>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">${plan.prices.monthly}</span>
                <span className="text-gray-400 text-sm">/{isRTL ? "شهر" : "mo"}</span>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className={`w-4 h-4 ${c.text} shrink-0`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate("/signup")}
                className={`w-full py-3 rounded-xl bg-gradient-to-r ${c.btn} text-white font-semibold shadow-lg ${c.shadow} hover:opacity-90 transition-all`}
              >
                {isRTL ? "ابدأ مجاناً" : "Start Free Trial"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Plans;
