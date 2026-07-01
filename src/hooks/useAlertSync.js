import { useEffect, useRef } from "react";
import { doc, getDocs, query, setDoc, where, limit } from "firebase/firestore";
import { getTenantCollections } from "../config/dbConfig";
import { useTenant } from "../context/TenantContext";
import useInventory from "./useInventory";

const useAlertSync = () => {
  const { tenantId }         = useTenant();
  const { items, loading }   = useInventory();
  const lastStatusRef        = useRef(new Map());

  useEffect(() => {
    if (loading || !items?.length || !tenantId) return;

    let isCancelled = false;

    const syncAlerts = async () => {
      const cols = getTenantCollections(tenantId);

      for (const item of items) {
        if (isCancelled || !item?.id) return;

        const qty       = parseInt(item.quantity) || 0;
        const threshold = parseInt(item.minimum_threshold) || 5;
        const isLow     = qty <= threshold;
        const prevStatus = lastStatusRef.current.get(item.id);

        lastStatusRef.current.set(item.id, isLow);
        if (!isLow || prevStatus === true) continue;

        const q = query(
          cols.alerts,
          where("item_id", "==", item.id),
          where("type",    "==", "LOW_STOCK"),
          where("is_read", "==", false),
          limit(1)
        );

        const existing = await getDocs(q);
        if (!existing.empty) continue;

        const newAlertRef = doc(cols.alerts);
        await setDoc(newAlertRef, {
          alert_id:   newAlertRef.id,
          item_id:    item.id,
          type:       "LOW_STOCK",
          message_en: `"${item.name_en || "Item"}" stock dropped to critical level (${qty} remaining).`,
          message_ar: `انخفض مخزون "${item.name_ar || "الصنف"}" إلى مستوى حرج (متبقي ${qty}).`,
          is_read:    false,
          created_at: new Date().toISOString(),
        });
      }
    };

    syncAlerts();
    return () => { isCancelled = true; };
  }, [items, loading, tenantId]);
};

export default useAlertSync;
