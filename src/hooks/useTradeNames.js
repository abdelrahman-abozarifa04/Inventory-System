import { useCallback, useEffect, useMemo, useState } from "react";
import { onSnapshot, query, orderBy, doc, setDoc } from "firebase/firestore";
import { getTenantCollections } from "../config/dbConfig";
import { useTenant } from "../context/TenantContext";

const normalize = (s) => String(s || "").trim().toLowerCase();
const toIsoNow  = () => new Date().toISOString();

export const useTradeNames = () => {
  const { tenantId } = useTenant();
  const [tradeNames, setTradeNames] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [creating,   setCreating]   = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!tenantId) {
      setTradeNames([]);
      setLoading(false);
      return;
    }

    const cols = getTenantCollections(tenantId);
    const q    = query(cols.tradeNames, orderBy("name_en_lower", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setTradeNames(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("[useTradeNames] fetch error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  const indexByNormalizedName = useMemo(() => {
    const map = new Map();
    for (const t of tradeNames) {
      const en = normalize(t.name_en);
      const ar = normalize(t.name_ar);
      if (en) map.set(`en:${en}`, t);
      if (ar) map.set(`ar:${ar}`, t);
    }
    return map;
  }, [tradeNames]);

  const createTradeName = useCallback(
    async ({ name_en, name_ar }) => {
      if (!tenantId) throw new Error("No tenant");
      const trimmedEn = String(name_en || "").trim();
      const trimmedAr = String(name_ar || "").trim();
      if (!trimmedEn && !trimmedAr) throw new Error("Trade name is required.");

      const existing =
        indexByNormalizedName.get(`en:${normalize(trimmedEn)}`) ||
        indexByNormalizedName.get(`ar:${normalize(trimmedAr)}`);
      if (existing) return existing;

      setCreating(true);
      setError(null);
      try {
        const cols   = getTenantCollections(tenantId);
        const newRef = doc(cols.tradeNames);
        const now    = toIsoNow();

        const payload = {
          name_en:       trimmedEn || trimmedAr,
          name_ar:       trimmedAr || trimmedEn,
          name_en_lower: normalize(trimmedEn || trimmedAr),
          name_ar_lower: normalize(trimmedAr || trimmedEn),
          created_at:    now,
          updated_at:    now,
        };

        await setDoc(newRef, payload);
        return { id: newRef.id, ...payload };
      } finally {
        setCreating(false);
      }
    },
    [tenantId, indexByNormalizedName]
  );

  return { tradeNames, loading, creating, error, createTradeName };
};

export default useTradeNames;
