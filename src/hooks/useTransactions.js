import { useState, useEffect } from "react";
import {
  onSnapshot,
  doc,
  runTransaction,
  query,
  orderBy,
  collection,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { getTenantCollections } from "../config/dbConfig";
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";

export const useTransactions = () => {
  const { tenantId }  = useTenant();
  const { user }      = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!tenantId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const cols = getTenantCollections(tenantId);
    const q    = query(cols.transactions, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        setLoading(false);
      },
      (err) => {
        console.error("[useTransactions] fetch error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  /**
   * Atomic Firestore transaction: update inventory qty + log transaction + auto-alert.
   */
  const recordTransaction = async ({ itemDocId, type, quantity_changed }) => {
    if (!itemDocId || !type || !quantity_changed) throw new Error("Missing transaction details");
    if (!user)     throw new Error("User must be authenticated");
    if (!tenantId) throw new Error("No tenant");

    const cols = getTenantCollections(tenantId);

    await runTransaction(db, async (tx) => {
      const itemRef = doc(db, `tenants/${tenantId}/inventory_items`, itemDocId);
      const itemDoc = await tx.get(itemRef);

      if (!itemDoc.exists()) throw new Error("Item does not exist!");

      const itemData  = itemDoc.data();
      const currentQty = parseInt(itemData.total_quantity ?? itemData.quantity) || 0;
      const change     = parseInt(quantity_changed);
      const newQty     = type === "IN" ? currentQty + change : currentQty - change;
      const threshold  = parseInt(itemData.minimum_threshold) || 5;

      if (newQty < 0) throw new Error("Quantity cannot be negative!");

      // Write transaction log
      const newTxRef = doc(cols.transactions);
      tx.set(newTxRef, {
        transaction_id:  newTxRef.id,
        item_id:         itemData.item_id || itemDocId,
        item_name_en:    itemData.name_en || "",
        item_name_ar:    itemData.name_ar || "",
        type,
        quantity_changed: change,
        date:            new Date().toISOString(),
        user_id:         user.uid,
        user_name:       user.displayName || user.email,
      });

      // Update inventory quantity
      tx.update(itemRef, {
        quantity:      newQty,
        total_quantity: newQty,
        last_updated:  new Date().toISOString(),
      });

      // Auto-alert on low stock threshold crossing
      if (newQty <= threshold && currentQty > threshold) {
        const newAlertRef = doc(cols.alerts);
        tx.set(newAlertRef, {
          alert_id:   newAlertRef.id,
          item_id:    itemDocId,
          type:       "LOW_STOCK",
          message_en: `"${itemData.name_en}" stock dropped to critical level (${newQty} remaining).`,
          message_ar: `انخفض مخزون "${itemData.name_ar}" إلى مستوى حرج (متبقي ${newQty}).`,
          is_read:    false,
          created_at: new Date().toISOString(),
        });
      }
    });

    return true;
  };

  return { transactions, loading, error, recordTransaction };
};

export default useTransactions;
