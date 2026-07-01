import { useState, useEffect, useCallback, useContext } from "react";
import { collection, doc, onSnapshot, query, orderBy, runTransaction } from "firebase/firestore";
import { db } from "../config/firebase";
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";
import { calculateAlertDate } from "../utils/alertUtils";

/**
 * useBatches — manages subcollection /tenants/{tenantId}/inventory_items/{itemId}/batches
 */
export const useBatches = (itemId) => {
  const { tenantId }     = useTenant();
  const { user }         = useAuth();
  const toast            = useContext(ToastContext);
  const [batches, setBatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  useEffect(() => {
    if (!itemId || !tenantId) {
      setBatches([]);
      setLoading(false);
      return;
    }

    const batchesRef = collection(db, `tenants/${tenantId}/inventory_items`, itemId, "batches");
    const q = query(batchesRef, orderBy("expiration_date", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setBatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(`[useBatches] error for item ${itemId}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [itemId, tenantId]);

  const computeAggregates = (batchList) => {
    const total_quantity  = batchList.reduce((s, b) => s + (parseInt(b.quantity) || 0), 0);
    const expDates        = batchList.map((b) => b.expiration_date).filter((d) => typeof d === "string" && d.trim());
    const nearest_expiry  = expDates.length > 0 ? expDates.sort()[0] : "";
    const batch_count     = batchList.length;
    return { total_quantity, nearest_expiry, batch_count };
  };

  const addBatch = useCallback(
    async (batchData) => {
      if (!itemId)    throw new Error("Parent Item ID is required.");
      if (!tenantId)  throw new Error("No tenant.");
      if (!user)      throw new Error("User must be authenticated.");

      try {
        await runTransaction(db, async (tx) => {
          const itemRef  = doc(db, `tenants/${tenantId}/inventory_items`, itemId);
          const itemSnap = await tx.get(itemRef);
          if (!itemSnap.exists()) throw new Error("Parent item does not exist.");

          const batchCount     = parseInt(itemSnap.data().batch_count) || batches.length || 0;
          const nextBatchNumber = `Batch #${batchCount + 1}`;

          const batchesRef  = collection(db, `tenants/${tenantId}/inventory_items`, itemId, "batches");
          const newBatchRef = doc(batchesRef);

          const alertTriggerDate =
            batchData.expiration_date && batchData.alert_lead_value && batchData.alert_lead_unit
              ? calculateAlertDate(batchData.expiration_date, parseInt(batchData.alert_lead_value), batchData.alert_lead_unit) || ""
              : "";

          const freshBatch = {
            batch_id:          newBatchRef.id,
            batch_number:      nextBatchNumber,
            quantity:          parseInt(batchData.quantity) || 0,
            production_date:   batchData.production_date || "",
            expiration_date:   batchData.expiration_date || "",
            alert_lead_value:  parseInt(batchData.alert_lead_value) || 0,
            alert_lead_unit:   batchData.alert_lead_unit || "weeks",
            alert_trigger_date: alertTriggerDate,
            created_at:        new Date().toISOString(),
          };

          const aggregates = computeAggregates([...batches, freshBatch]);
          tx.set(newBatchRef, freshBatch);
          tx.update(itemRef, { ...aggregates, quantity: aggregates.total_quantity, last_updated: new Date().toISOString() });
        });

        toast?.addToast({ type: "success", message: "✅ Batch added successfully.", duration: 3000 });
      } catch (err) {
        console.error("[useBatches] addBatch failed:", err);
        toast?.addToast({ type: "error", message: `❌ Failed: ${err.message}`, duration: 4000 });
        throw err;
      }
    },
    [itemId, tenantId, batches, user, toast]
  );

  const updateBatch = useCallback(
    async (batchId, updatedFields) => {
      if (!itemId || !batchId) throw new Error("Item ID and Batch ID are required.");
      if (!tenantId)           throw new Error("No tenant.");
      if (!user)               throw new Error("User must be authenticated.");

      try {
        await runTransaction(db, async (tx) => {
          const itemRef  = doc(db, `tenants/${tenantId}/inventory_items`, itemId);
          const batchRef = doc(db, `tenants/${tenantId}/inventory_items`, itemId, "batches", batchId);
          const itemSnap  = await tx.get(itemRef);
          const batchSnap = await tx.get(batchRef);

          if (!itemSnap.exists())  throw new Error("Parent item does not exist.");
          if (!batchSnap.exists()) throw new Error("Batch does not exist.");

          const mergedBatch = { ...batchSnap.data(), ...updatedFields };
          let alertTriggerDate = mergedBatch.alert_trigger_date || "";
          if (updatedFields.expiration_date !== undefined || updatedFields.alert_lead_value !== undefined || updatedFields.alert_lead_unit !== undefined) {
            alertTriggerDate = calculateAlertDate(mergedBatch.expiration_date, parseInt(mergedBatch.alert_lead_value), mergedBatch.alert_lead_unit) || "";
          }

          const finalFields = { ...updatedFields, quantity: parseInt(mergedBatch.quantity) || 0, alert_trigger_date: alertTriggerDate, last_updated: new Date().toISOString() };
          const simulatedList = batches.map((b) => (b.id === batchId ? { ...b, ...finalFields } : b));
          const aggregates = computeAggregates(simulatedList);

          tx.update(batchRef, finalFields);
          tx.update(itemRef, { ...aggregates, quantity: aggregates.total_quantity, last_updated: new Date().toISOString() });
        });

        toast?.addToast({ type: "success", message: "✅ Batch updated successfully.", duration: 3000 });
      } catch (err) {
        console.error("[useBatches] updateBatch failed:", err);
        toast?.addToast({ type: "error", message: `❌ Failed: ${err.message}`, duration: 4000 });
        throw err;
      }
    },
    [itemId, tenantId, batches, user, toast]
  );

  const deleteBatch = useCallback(
    async (batchId) => {
      if (!itemId || !batchId) throw new Error("Item ID and Batch ID are required.");
      if (!tenantId)           throw new Error("No tenant.");
      if (!user)               throw new Error("User must be authenticated.");

      try {
        await runTransaction(db, async (tx) => {
          const itemRef  = doc(db, `tenants/${tenantId}/inventory_items`, itemId);
          const batchRef = doc(db, `tenants/${tenantId}/inventory_items`, itemId, "batches", batchId);
          const itemSnap  = await tx.get(itemRef);
          const batchSnap = await tx.get(batchRef);

          if (!itemSnap.exists())  throw new Error("Parent item does not exist.");
          if (!batchSnap.exists()) throw new Error("Batch does not exist.");

          const simulatedList = batches.filter((b) => b.id !== batchId);
          const aggregates = computeAggregates(simulatedList);

          tx.delete(batchRef);
          tx.update(itemRef, { ...aggregates, quantity: aggregates.total_quantity, last_updated: new Date().toISOString() });
        });

        toast?.addToast({ type: "success", message: "✅ Batch deleted successfully.", duration: 3000 });
      } catch (err) {
        console.error("[useBatches] deleteBatch failed:", err);
        toast?.addToast({ type: "error", message: `❌ Failed: ${err.message}`, duration: 4000 });
        throw err;
      }
    },
    [itemId, tenantId, batches, user, toast]
  );

  return { batches, loading, error, addBatch, updateBatch, deleteBatch };
};

export default useBatches;
