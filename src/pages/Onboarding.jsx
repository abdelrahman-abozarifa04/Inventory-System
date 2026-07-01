import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { doc, setDoc, serverTimestamp, collection, writeBatch } from "firebase/firestore";
import { db } from "../config/firebase";
import { STORE_TYPES, DEFAULT_CATEGORIES_BY_TYPE } from "../config/dbConfig";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import {
  Package, Pill, Hospital, UtensilsCrossed, ShoppingCart, Warehouse,
  ArrowRight, ArrowLeft, ChevronRight, ChevronLeft, Loader2, Upload, Check,
} from "lucide-react";

const ICON_MAP = { Pill, Hospital, UtensilsCrossed, ShoppingCart, Warehouse, Package };

const CURRENCIES = [
  { code: "EGP", symbol: "ج.م",  label: "جنيه مصري" },
  { code: "USD", symbol: "$",    label: "US Dollar" },
  { code: "SAR", symbol: "ر.س",  label: "ريال سعودي" },
  { code: "AED", symbol: "د.إ",  label: "درهم إماراتي" },
  { code: "EUR", symbol: "€",    label: "Euro" },
  { code: "GBP", symbol: "£",    label: "British Pound" },
];

const STEPS = ["storeType", "storeInfo", "currency", "done"];

const Onboarding = () => {
  const { t, i18n }  = useTranslation();
  const isRTL        = i18n.language === "ar";
  const navigate     = useNavigate();
  const { user, bindTenant } = useAuth();
  const { addToast } = useToast();

  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({
    storeType:      "",
    name_en:        "",
    name_ar:        "",
    logoUrl:        null,
    currency:       "EGP",
    currencySymbol: "ج.م",
  });

  const currentStep = STEPS[step];
  const Next  = isRTL ? ChevronLeft : ChevronRight;
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  // ── Logo upload (base64 for simplicity) ────────────────────────────────────
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, logoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  // ── Provision tenant in Firestore ──────────────────────────────────────────
  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const tenantRef = doc(collection(db, "tenants")); // auto-ID
      const tenantId  = tenantRef.id;
      const now       = serverTimestamp();
      const batch     = writeBatch(db);

      // 1. Tenant root (placeholder)
      batch.set(tenantRef, { createdAt: now, ownerId: user.uid });

      // 2. Tenant settings
      const settingsRef = doc(db, `tenants/${tenantId}/settings/system`);
      batch.set(settingsRef, {
        name_en:           form.name_en || form.name_ar,
        name_ar:           form.name_ar || form.name_en,
        logoUrl:           form.logoUrl,
        storeType:         form.storeType,
        currency:          form.currency,
        currencySymbol:    form.currencySymbol,
        timezone:          "Africa/Cairo",
        lowStockThreshold: 5,
        expiryAlertDays:   30,
        primaryColor:      "#0891b2",
        address:           "",
        phone:             "",
        email:             user.email || "",
        created_at:        new Date().toISOString(),
      });

      // 3. Default categories
      const defaults = DEFAULT_CATEGORIES_BY_TYPE[form.storeType] || [];
      for (const cat of defaults) {
        const catRef = doc(collection(db, `tenants/${tenantId}/categories`));
        batch.set(catRef, {
          name_en:       cat.name_en,
          name_ar:       cat.name_ar,
          name_en_lower: cat.name_en.toLowerCase(),
          name_ar_lower: cat.name_ar,
          created_at:    new Date().toISOString(),
          updated_at:    new Date().toISOString(),
        });
      }

      // 4. Trial subscription (7 days)
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      const subRef = doc(db, `tenants/${tenantId}/subscription/active`);
      batch.set(subRef, {
        tenantId,
        status:        "trial",
        plan:          "starter",
        trialEnd:      trialEnd.toISOString(),
        startDate:     new Date().toISOString(),
        endDate:       trialEnd.toISOString(),
        paymentMethod: null,
        createdAt:     now,
      });

      await batch.commit();

      // 5. Bind user → tenant
      await bindTenant(tenantId);

      addToast({ type: "success", message: isRTL ? "🎉 تم إنشاء المخزن بنجاح!" : "🎉 Store created successfully!", duration: 3000 });
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[Onboarding] error:", err);
      addToast({ type: "error", message: err.message, duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-cyan-950 p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-cyan-500 w-12" : "bg-gray-700 w-8"}`} />
          ))}
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-8 shadow-2xl">

          {/* ── Step 1: Store Type ──────────────────────────────────────────── */}
          {currentStep === "storeType" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">{isRTL ? "اختر نوع المخزن" : "Choose Store Type"}</h2>
              <p className="text-gray-400 text-sm mb-6">{isRTL ? "هذا يحدد الكاتيجوريز الافتراضية والأيقونة" : "This sets default categories and icon"}</p>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(STORE_TYPES).map(([key, val]) => {
                  const Icon = ICON_MAP[val.icon] || Package;
                  const selected = form.storeType === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setForm((p) => ({ ...p, storeType: key }))}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                        selected
                          ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                          : "border-gray-700/50 bg-gray-800/40 text-gray-300 hover:border-gray-600 hover:bg-gray-800/70"
                      }`}
                    >
                      <Icon className="w-7 h-7" />
                      <span className="text-sm font-medium">{isRTL ? val.label_ar : val.label_en}</span>
                      {selected && <Check className="w-4 h-4 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={goNext}
                disabled={!form.storeType}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-40"
              >
                {isRTL ? "التالي" : "Next"} <Next className="w-4 h-4" />
              </button>
            </>
          )}

          {/* ── Step 2: Store Info ──────────────────────────────────────────── */}
          {currentStep === "storeInfo" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">{isRTL ? "بيانات المخزن" : "Store Details"}</h2>
              <p className="text-gray-400 text-sm mb-6">{isRTL ? "ادخل اسم مخزنك باللغتين" : "Enter your store name in both languages"}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{isRTL ? "اسم المخزن (عربي)" : "Store Name (Arabic)"}</label>
                  <input
                    value={form.name_ar}
                    onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                    placeholder="مثال: صيدلية أحمد"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{isRTL ? "اسم المخزن (إنجليزي)" : "Store Name (English)"}</label>
                  <input
                    value={form.name_en}
                    onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                    placeholder="e.g. Ahmed's Pharmacy"
                    dir="ltr"
                  />
                </div>

                {/* Logo upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{isRTL ? "اللوجو (اختياري)" : "Logo (optional)"}</label>
                  <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-gray-700/50 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-all cursor-pointer">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                    <span className="text-sm">{form.logoUrl ? (isRTL ? "تغيير اللوجو" : "Change logo") : (isRTL ? "ارفع لوجو" : "Upload logo")}</span>
                    <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={goBack} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all">
                  {isRTL ? "السابق" : "Back"}
                </button>
                <button
                  onClick={goNext}
                  disabled={!form.name_en && !form.name_ar}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-40"
                >
                  {isRTL ? "التالي" : "Next"} <Next className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Currency ────────────────────────────────────────────── */}
          {currentStep === "currency" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">{isRTL ? "اختر العملة" : "Choose Currency"}</h2>
              <p className="text-gray-400 text-sm mb-6">{isRTL ? "العملة اللي هتستخدمها في الأسعار" : "Currency used for pricing"}</p>

              <div className="space-y-2">
                {CURRENCIES.map((c) => {
                  const selected = form.currency === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => setForm((p) => ({ ...p, currency: c.code, currencySymbol: c.symbol }))}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all ${
                        selected ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700/50 bg-gray-800/40 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-200 w-8">{c.symbol}</span>
                        <span className="text-sm text-gray-300">{c.label}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">{c.code}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={goBack} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all">
                  {isRTL ? "السابق" : "Back"}
                </button>
                <button
                  onClick={goNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all"
                >
                  {isRTL ? "التالي" : "Next"} <Next className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ── Step 4: Done ───────────────────────────────────────────────── */}
          {currentStep === "done" && (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 mb-4">
                  <Check className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{isRTL ? "كل حاجة جاهزة! 🎉" : "All set! 🎉"}</h2>
                <p className="text-gray-400 text-sm mb-6">
                  {isRTL
                    ? `هتم إنشاء "${form.name_ar || form.name_en}" مع فترة تجريبية 7 أيام`
                    : `"${form.name_en || form.name_ar}" will be created with a 7-day free trial`}
                </p>

                {/* Summary */}
                <div className="bg-gray-800/50 rounded-xl p-4 text-start text-sm text-gray-300 space-y-2 mb-6">
                  <div className="flex justify-between"><span>{isRTL ? "النوع" : "Type"}</span><span className="text-gray-100">{STORE_TYPES[form.storeType]?.[isRTL ? "label_ar" : "label_en"]}</span></div>
                  <div className="flex justify-between"><span>{isRTL ? "الاسم" : "Name"}</span><span className="text-gray-100">{form.name_ar || form.name_en}</span></div>
                  <div className="flex justify-between"><span>{isRTL ? "العملة" : "Currency"}</span><span className="text-gray-100">{form.currencySymbol} ({form.currency})</span></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={goBack} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all">
                  {isRTL ? "السابق" : "Back"}
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isRTL ? "إنشاء المخزن" : "Create Store"} <Arrow className="w-4 h-4" /></>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
