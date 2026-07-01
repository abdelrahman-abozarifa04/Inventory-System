import { useState, useEffect } from "react";
import { onSnapshot, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { getTenantCollections } from "../config/dbConfig";
import { useTenant } from "../context/TenantContext";

export const useAlerts = () => {
  const { tenantId } = useTenant();
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!tenantId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const cols = getTenantCollections(tenantId);
    const q    = query(cols.alerts, orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAlerts(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        setLoading(false);
      },
      (err) => {
        console.error("[useAlerts] fetch error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  const markAsRead = async (alertId) => {
    if (!tenantId) throw new Error("No tenant");
    const alertRef = doc(db, `tenants/${tenantId}/alerts`, alertId);
    await updateDoc(alertRef, { is_read: true });
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return { alerts, unreadCount, loading, error, markAsRead };
};

export default useAlerts;
