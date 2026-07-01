import { createContext, useState, useEffect, useContext } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef  = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(data);
            setTenantId(data.tenantId || null);
          } else {
            // Fresh user — profile will be created during onboarding
            const defaultProfile = {
              uid:                 currentUser.uid,
              email:               currentUser.email,
              name:                currentUser.displayName || "User",
              role:                "owner",
              language_preference: "ar",
              tenantId:            null, // set after onboarding
            };
            await setDoc(docRef, defaultProfile);
            setProfile(defaultProfile);
            setTenantId(null);
          }
        } catch (error) {
          console.error("[AuthContext] profile fetch error:", error);
        }
      } else {
        setProfile(null);
        setTenantId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /** Standard email/password login */
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  /** Sign up — creates Firebase Auth user + sends verification email */
  const signup = async (email, password, name) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user);
    return credential;
  };

  const logout = () => signOut(auth);

  /** Merge-update the /users/{uid} document and local profile state */
  const updateProfileInfo = async (updates) => {
    if (!user) throw new Error("No authenticated user");
    const docRef = doc(db, "users", user.uid);
    await setDoc(docRef, updates, { merge: true });
    setProfile((prev) => ({ ...prev, ...updates }));
    if (updates.tenantId !== undefined) setTenantId(updates.tenantId);
  };

  /** Called after onboarding to bind user → tenant */
  const bindTenant = async (newTenantId) => {
    await updateProfileInfo({ tenantId: newTenantId });
  };

  // Safety timeout — prevent infinite loading spinner
  useEffect(() => {
    const t = setTimeout(() => { if (loading) setLoading(false); }, 6000);
    return () => clearTimeout(t);
  }, [loading]);

  const value = {
    user,
    profile,
    tenantId,
    loading,
    login,
    signup,
    logout,
    updateProfileInfo,
    bindTenant,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center bg-gray-950 flex-col gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium text-sm tracking-wide">مخزني — جاري التحميل...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export default useAuth;
