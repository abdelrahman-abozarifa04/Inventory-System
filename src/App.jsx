import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { SubscriptionGuard } from "./components/auth/SubscriptionGuard";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Alerts from "./pages/Alerts";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Plans from "./pages/Plans";
import Onboarding from "./pages/Onboarding";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import useDirection from "./hooks/useDirection";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TenantProvider } from "./context/TenantContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SystemProvider } from "./context/SystemContext";
import { ToastProvider } from "./context/ToastContext";
import { ToastContainer } from "./components/ui/Toast";

// Import i18n configuration
import "./i18n/i18n";

/**
 * Inner app — needs AuthContext to read tenantId, then wraps children with
 * TenantProvider → SystemProvider → SubscriptionGuard.
 */
function AppInner() {
  const { tenantId } = useAuth();

  return (
    <TenantProvider tenantId={tenantId}>
      <SystemProvider tenantId={tenantId}>
        <BrowserRouter>
          <Routes>
            {/* ── Public ───────────────────────────────────────── */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/plans"  element={<Plans />} />

            {/* ── Semi-protected (auth only, no subscription needed) ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding"           element={<Onboarding />} />
              <Route path="/subscription-expired"  element={<SubscriptionExpired />} />
              <Route path="/billing"               element={<Billing />} />
            </Route>

            {/* ── Fully protected (auth + subscription) ────────── */}
            <Route element={<ProtectedRoute />}>
              <Route
                element={
                  <SubscriptionGuard>
                    <AppShell />
                  </SubscriptionGuard>
                }
              >
                <Route path="/"             element={<Dashboard />} />
                <Route path="/inventory"    element={<Inventory />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/alerts"       element={<Alerts />} />
                <Route path="/settings"     element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </SystemProvider>
    </TenantProvider>
  );
}

/**
 * Root Application Component
 */
function App() {
  useDirection();

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
