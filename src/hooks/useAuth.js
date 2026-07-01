import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * useAuth — shorthand hook for AuthContext.
 * Returns: user, profile, tenantId, loading, login, signup, logout, updateProfileInfo, bindTenant
 */
const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export { useAuth };
export default useAuth;
