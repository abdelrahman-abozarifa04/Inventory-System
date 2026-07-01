import { useState, useCallback, useContext } from "react";
import { doc, runTransaction, getDocs, collection } from "firebase/firestore";
import { db } from "../config/firebase";
import { getTenantCollections } from "../config/dbConfig";
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";
import { calculateAlertDate } from "../utils/alertUtils";

/**
 * useRestockScan — Smart Inbound / Restock Scan Hook (tenant-scoped)
 */
const useRestockScan = (items = []) => {
  const { tenantId } = useTenant();
  const { user }     = useAuth();
  const toast        = useContext(ToastContext);

  const [matchedItem,    setMatchedItem]    = useState(null);
  const [prefillBarcode, setPrefillBarcode] = useState("");
  const [isRestocking,   setIsRestocking]   = useState(false);

  const handleScanResult = useCallback(
    (barcode) => {
      if (!barcode) return;
      const normalized = barcode.trim().toLowerCase();

      const found = items.find(
        (itm) =>
          itm.serial_number?.toLowerCase() === normalized ||
          itm.item_id?.toLowerCase()       === normalized ||
          itm.id?.toLowerCase()            === normalized
      );

      if (found) {
        setMatchedItem(found);
        setPrefillBarcode("");
      } else {
        setPrefillBarcode(barcode.trim());
        setMatchedItem(null);
      }
    },
    [items]
  );

  const confirmRestock = useCallback(
    async (item, qty, batchInfo = null) => {
      if (!item || !qty || qty < 1) throw new Error("Invalid restock parameters.");
      if (!user)     throw new Error("You must be logged in to perform a restock.");
      if (!tenantId) throw new Error("No tenant.");

      const cols = getTenantCollections(tenantId);
      setIsRestocking(true);

      try {
        let currentBatches = [];
        if (batchInfo) {
          const batchesRef  = collection(db, `tenants/${tenantId}/inventory_items`, item.id, "batches");
          const batchesSnap = await getDocs(batchesRef);
          currentBatches    = batchesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        await runTransaction(db, async (tx) => {
          const itemRef  = doc(db, `tenants/${tenantId}/inventory_items`, item.id);
          const itemSnap = await tx.get(itemRef);

          if (!itemSnap.exists()) throw new Error("Item no longer exists in inventory.");

          const data = itemSnap.data();
          const now  = new Date().toISOString();

          // IN transaction log
          const txRef = doc(cols.transactions);
          tx.set(txRef, {
            transaction_id: txRef.id,
            item_id:        data.item_id || item.id,
            item_name_en:   data.name_en || "",
            item_name_ar:   data.name_ar || "",
            type:           "IN",
            quantity_changed: parseInt(qty),
            date:           now,
            user_id:        user.uid,
            user_name:      user.displayName || user.email || "Unknown",
            source:         "restock_scan",
          });

          if (batchInfo) {
            let updatedBatches = [];

            if (batchInfo.type === "existing") {
              const batchRef  = doc(db, `tenants/${tenantId}/inventory_items`, item.id, "batches", batchInfo.batchId);
              const batchSnap = await tx.get(batchRef);
              if (!batchSnap.exists()) throw new Error("Target batch does not exist.");

              const batchData    = batchSnap.data();
              const newBatchQty  = (parseInt(batchData.quantity) || 0) + parseInt(qty);
              tx.update(batchRef, { quantity: newBatchQty, last_updated: now });
              updatedBatches = currentBatches.map((b) =>
                b.id === batchInfo.batchId ? { ...b, quantity: newBatchQty } : b
              );
            } else if (batchInfo.type === "new") {
              const newBatchRef   = doc(collection(db, `tenants/${tenantId}/inventory_items`, item.id, "batches"));
              const batchCount    = currentBatches.length;
              const nextBatchNum  = `Batch #${batchCount + 1}`;

              let alertTriggerDate = "";
              const expDate  = batchInfo.batchData.expiration_date;
              const leadVal  = parseInt(batchInfo.batchData.alert_lead_value);
              const leadUnit = batchInfo.batchData.alert_lead_unit;
              if (expDate && leadVal && leadUnit) {
                alertTriggerDate = calculateAlertDate(expDate, leadVal, leadUnit) || "";
              }

              const freshBatch = {
                batch_id:          newBatchRef.id,
                batch_number:      nextBatchNum,
                quantity:          parseInt(qty),
                production_date:   batchInfo.batchData.production_date || "",
                expiration_date:   batchInfo.batchData.expiration_date || "",
                alert_lead_value:  parseInt(batchInfo.batchData.alert_lead_value) || 0,
                alert_lead_unit:   batchInfo.batchData.alert_lead_unit || "weeks",
                alert_trigger_date: alertTriggerDate,
                created_at:        now,
              };

              tx.set(newBatchRef, freshBatch);
              updatedBatches = [...currentBatches, { id: newBatchRef.id, ...freshBatch }];
            }

            const total_quantity = updatedBatches.reduce((s, b) => s + (parseInt(b.quantity) || 0), 0);
            const expDates       = updatedBatches.map((b) => b.expiration_date).filter((d) => typeof d === "string" && d.trim());
            const nearest_expiry = expDates.length > 0 ? expDates.sort()[0] : "";
            const batch_count    = updatedBatches.length;

            tx.update(itemRef, { total_quantity, nearest_expiry, batch_count, quantity: total_quantity, last_updated: now });
          } else {
            const currentQty = parseInt(data.quantity) || 0;
            const newQty     = currentQty + parseInt(qty);
            tx.update(itemRef, { quantity: newQty, last_updated: now });
          }
        });

        toast?.addToast({ type: "success", message: `✅ Stock updated! "${item.name_en}" → +${qty} units added.`, duration: 4500 });
        return true;
      } catch (err) {
        console.error("[useRestockScan] confirmRestock failed:", err);
        toast?.addToast({ type: "error", message: `❌ Restock failed: ${err.message}`, duration: 5000 });
        throw err;
      } finally {
        setIsRestocking(false);
      }
    },
    [tenantId, user, toast]
  );

  const clearMatch   = useCallback(() => setMatchedItem(null), []);
  const clearPrefill = useCallback(() => setPrefillBarcode(""), []);

  return { matchedItem, prefillBarcode, handleScanResult, confirmRestock, clearMatch, clearPrefill, isRestocking };
};

export default useRestockScan;
