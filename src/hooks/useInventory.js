import { useState, useEffect } from "react";
import {
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch,
  collection,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { getTenantCollections } from "../config/dbConfig";
import { useTenant } from "../context/TenantContext";
import { calculateAlertDate } from "../utils/alertUtils";

export const useInventory = () => {
  const { tenantId } = useTenant();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!tenantId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const cols = getTenantCollections(tenantId);
    const q    = query(cols.inventoryItems, orderBy("last_updated", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
        setLoading(false);
      },
      (err) => {
        console.error("[useInventory] fetch error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  const addItem = async (itemData, initialBatch = null) => {
    if (!tenantId) throw new Error("No tenant");
    const cols = getTenantCollections(tenantId);
    const batch = writeBatch(db);
    const newItemRef = doc(cols.inventoryItems);

    let finalItemData = {
      item_id: itemData.item_id || newItemRef.id,
      ...itemData,
      last_updated: new Date().toISOString(),
    };

    if (initialBatch) {
      const alertTriggerDate =
        initialBatch.expiration_date && initialBatch.alert_lead_value && initialBatch.alert_lead_unit
          ? calculateAlertDate(
              initialBatch.expiration_date,
              parseInt(initialBatch.alert_lead_value),
              initialBatch.alert_lead_unit
            ) || ""
          : "";

      const subcollRef = collection(
        db,
        `tenants/${tenantId}/inventory_items`,
        newItemRef.id,
        "batches"
      );
      const newBatchRef = doc(subcollRef);

      const batchPayload = {
        batch_id:          newBatchRef.id,
        batch_number:      "Batch #1",
        quantity:          parseInt(initialBatch.quantity) || 0,
        production_date:   initialBatch.production_date || "",
        expiration_date:   initialBatch.expiration_date || "",
        alert_lead_value:  parseInt(initialBatch.alert_lead_value) || 0,
        alert_lead_unit:   initialBatch.alert_lead_unit || "weeks",
        alert_trigger_date: alertTriggerDate,
        created_at:        new Date().toISOString(),
      };

      batch.set(newBatchRef, batchPayload);

      finalItemData = {
        ...finalItemData,
        total_quantity: batchPayload.quantity,
        nearest_expiry: batchPayload.expiration_date,
        batch_count:    1,
        quantity:       batchPayload.quantity,
      };
    }

    batch.set(newItemRef, finalItemData);
    await batch.commit();
    return newItemRef.id;
  };

  const updateItem = async (docId, updateData) => {
    if (!tenantId) throw new Error("No tenant");
    const itemRef = doc(db, `tenants/${tenantId}/inventory_items`, docId);
    await updateDoc(itemRef, { ...updateData, last_updated: new Date().toISOString() });
  };

  const deleteItem = async (docId) => {
    if (!tenantId) throw new Error("No tenant");
    const itemRef = doc(db, `tenants/${tenantId}/inventory_items`, docId);
    await deleteDoc(itemRef);
  };

  return { items, loading, error, addItem, updateItem, deleteItem };
};

export default useInventory;
