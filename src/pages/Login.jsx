import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Package, Mail, LockKeyhole, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import LanguageToggle from "../components/ui/LanguageToggle";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const Login = () => {
  const { t, i18n } = useTranslation();
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRTL = i18n.dir(i18n.language) === "rtl";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t("login.error_missing")); // We will add these keys soon
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      // Simplify error message for demo
      setError("Invalid Email or Password. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg bg-pattern px-4">
      {/* Absolute Header with Language Toggle */}
      <div className="absolute top-6 end-6 z-50">
        <LanguageToggle />
      </div>

      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

      {/* Login Card */}
      <motion.div
        className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-gray-100 bg-surface/95 px-6 py-8 shadow-medium backdrop-blur-xl sm:px-8 sm:py-10"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-soft"
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          >
            <Package className="h-8 w-8 text-highlight" />
          </motion.div>
          <motion.h1
            className="text-2xl font-bold mb-2 text-center text-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {t("login.welcome_back") || "Welcome Back!"}
          </motion.h1>
          <motion.p
            className="text-sm text-text-muted text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {t("login.subtitle") || "Login to access your inventory dashboard"}
          </motion.p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-5">
          {/* Email Field */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={Mail}
              className="h-11 border-primary/20 bg-surface/80"
              placeholder={t("login.email_placeholder") || "Email Address"}
              required
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={LockKeyhole}
              className="h-11 border-primary/20 bg-surface/80"
              placeholder={t("login.password_placeholder") || "Password"}
              required
            />
          </motion.div>

          <Button
            className={`
              mt-2 w-full
              ${loading ? "opacity-80 cursor-wait" : ""}
            `}
            size="lg"
            disabled={loading}
            motionProps={{
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.6 },
            }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{t("login.submit") || "Log In"}</span>
                <LogIn className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
              </>
            )}
          </Button>
        </form>

        <motion.div 
          className="text-center text-sm text-text-muted mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {isRTL ? "معندكش حساب؟" : "Don't have an account?"}{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline">
            {isRTL ? "سجّل الآن" : "Sign Up"}
          </Link>
        </motion.div>

        <motion.div 
          className="text-center text-xs text-text-muted mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          &copy; {new Date().getFullYear()} Makhzani — مخزني
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
