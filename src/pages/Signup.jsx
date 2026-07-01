import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";

const Signup = () => {
  const { t, i18n } = useTranslation();
  const isRTL       = i18n.language === "ar";
  const navigate    = useNavigate();
  const { signup }  = useAuth();
  const { addToast } = useToast();

  const [form, setForm]       = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      addToast({ type: "error", message: isRTL ? "كلمات المرور غير متطابقة" : "Passwords do not match", duration: 3000 });
      return;
    }
    if (form.password.length < 6) {
      addToast({ type: "error", message: isRTL ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters", duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      await signup(form.email, form.password, form.name);
      addToast({ type: "success", message: isRTL ? "تم إنشاء الحساب! جاري التحويل..." : "Account created! Redirecting…", duration: 3000 });
      navigate("/onboarding");
    } catch (err) {
      const msg = err.code === "auth/email-already-in-use"
        ? (isRTL ? "البريد الإلكتروني مسجل مسبقاً" : "Email already in use")
        : err.message;
      addToast({ type: "error", message: msg, duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-cyan-950 p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/25 mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">مخزني</h1>
          <p className="text-gray-400 mt-1 text-sm">{isRTL ? "نظام إدارة المخزون الذكي" : "Smart Inventory Management"}</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">{isRTL ? "إنشاء حساب جديد" : "Create Account"}</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{isRTL ? "الاسم" : "Name"}</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder={isRTL ? "اسمك الكامل" : "Full name"}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{isRTL ? "البريد الإلكتروني" : "Email"}</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="you@example.com"
                dir="ltr"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{isRTL ? "كلمة المرور" : "Password"}</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-gray-200">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}</label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isRTL ? "إنشاء الحساب" : "Create Account"} <Arrow className="w-4 h-4" /></>}
            </button>
          </form>

          {/* Link to login */}
          <p className="mt-6 text-center text-sm text-gray-400">
            {isRTL ? "عندك حساب؟" : "Already have an account?"}{" "}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              {isRTL ? "سجّل دخول" : "Log in"}
            </Link>
          </p>
        </div>

        {/* Trial note */}
        <p className="text-center text-xs text-gray-500 mt-4">
          {isRTL ? "🎁 فترة تجريبية مجانية 7 أيام — بدون بطاقة ائتمان" : "🎁 7-day free trial — no credit card required"}
        </p>
      </div>
    </div>
  );
};

export default Signup;
