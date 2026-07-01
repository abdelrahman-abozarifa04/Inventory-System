import { collection, doc } from "firebase/firestore";
import { db } from "./firebase";

// ─── Tenant-scoped collections ───────────────────────────────────────────────
// Each tenant has its own isolated data path: /tenants/{tenantId}/...
export const getTenantCollections = (tenantId) => ({
  inventoryItems: collection(db, `tenants/${tenantId}/inventory_items`),
  categories:     collection(db, `tenants/${tenantId}/categories`),
  tradeNames:     collection(db, `tenants/${tenantId}/trade_names`),
  transactions:   collection(db, `tenants/${tenantId}/transactions`),
  alerts:         collection(db, `tenants/${tenantId}/alerts`),
});

// Shorthand: get a single tenant sub-collection reference
export const getTenantCollection = (tenantId, collectionName) =>
  collection(db, `tenants/${tenantId}/${collectionName}`);

// Shorthand: get the tenant settings doc
export const getTenantSettingsDoc = (tenantId) =>
  doc(db, `tenants/${tenantId}/settings/system`);

// ─── Global collections (not tenant-scoped) ──────────────────────────────────
export const globalCollections = {
  users:         collection(db, "users"),
  plans:         collection(db, "plans"),
  subscriptions: collection(db, "subscriptions"),
};

// ─── Constants ───────────────────────────────────────────────────────────────
export const TRANSACTION_TYPES = {
  IN:  "IN",
  OUT: "OUT",
};

export const ALERTS = {
  LOW_STOCK:     "LOW_STOCK",
  EXPIRING_SOON: "EXPIRING_SOON",
};

export const STORE_TYPES = {
  pharmacy:    { icon: "Pill",            label_en: "Pharmacy",    label_ar: "صيدلية"   },
  clinic:      { icon: "Hospital",        label_en: "Clinic",      label_ar: "عيادة"    },
  restaurant:  { icon: "UtensilsCrossed", label_en: "Restaurant",  label_ar: "مطعم"     },
  supermarket: { icon: "ShoppingCart",    label_en: "Supermarket", label_ar: "سوبرماركت"},
  warehouse:   { icon: "Warehouse",       label_en: "Warehouse",   label_ar: "مستودع"   },
  general:     { icon: "Package",         label_en: "General",     label_ar: "عام"      },
};

export const DEFAULT_CATEGORIES_BY_TYPE = {
  pharmacy:    [{ name_en: "Medications", name_ar: "أدوية" }, { name_en: "Medical Supplies", name_ar: "مستلزمات طبية" }, { name_en: "Supplements", name_ar: "مكملات غذائية" }],
  clinic:      [{ name_en: "Tools", name_ar: "أدوات طبية" }, { name_en: "Consumables", name_ar: "مستهلكات" }, { name_en: "Medications", name_ar: "أدوية" }],
  restaurant:  [{ name_en: "Raw Materials", name_ar: "مواد خام" }, { name_en: "Beverages", name_ar: "مشروبات" }, { name_en: "Packaging", name_ar: "مواد تغليف" }],
  supermarket: [{ name_en: "Food", name_ar: "أغذية" }, { name_en: "Beverages", name_ar: "مشروبات" }, { name_en: "Cleaning", name_ar: "منظفات" }],
  warehouse:   [{ name_en: "Section A", name_ar: "قسم أ" }, { name_en: "Section B", name_ar: "قسم ب" }],
  general:     [],
};
