# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Makhzani** (مخزني) is a multi-tenant SaaS inventory management system aimed at Arabic/English small businesses (pharmacies, clinics, restaurants, supermarkets, warehouses). React 19 + Vite 8 SPA with a Firebase backend (Auth + Firestore + Storage + Cloud Messaging). Fully bilingual with RTL/LTR switching.

## Commands

```bash
npm run dev       # Vite dev server (HMR)
npm run build     # Production build
npm run preview   # Preview the production build
npm run lint      # ESLint (flat config in eslint.config.js)
```

There is **no test suite** in this repo — do not assume `npm test` exists.

Firebase config is read from `VITE_FIREBASE_*` environment variables (see `src/config/firebase.js`); they live in `.env` (gitignored). Deployed on Vercel (`vercel.json`, SPA rewrite to `/`).

## Architecture

### Multi-tenancy is the core invariant
Every business gets an isolated Firestore document tree under `tenants/{tenantId}/...`. **Never hardcode collection paths** — always go through `src/config/dbConfig.js`:
- `getTenantCollections(tenantId)` → `{ inventoryItems, categories, tradeNames, transactions, alerts }`
- `getTenantCollection(tenantId, name)` and `getTenantSettingsDoc(tenantId)` for one-offs
- `globalCollections` → non-tenant-scoped `users`, `plans`, `subscriptions`

`tenantId` originates in `AuthContext` (read from `users/{uid}.tenantId`) and flows down as a prop to `TenantProvider`/`SystemProvider`. When `tenantId` is `null` the user is pre-onboarding — hooks must short-circuit to empty/default state rather than build a broken path (see the `if (!tenantId)` guards at the top of every hook).

### Context provider stack (order matters — see `src/App.jsx`)
`ThemeProvider → ToastProvider → AuthProvider → AppInner(TenantProvider → SystemProvider → BrowserRouter)`
- **AuthContext** — Firebase Auth state, the `users/{uid}` profile, `tenantId`, `login/signup/logout/bindTenant`. Blocks render with a loading spinner until auth resolves (6s safety timeout).
- **TenantContext** — tenant settings + subscription (`subscriptionStatus`, `isSubscriptionValid`, `trialDaysRemaining`), `updateTenantSettings`, `initTenantSubscription`.
- **SystemContext** — also subscribes to `settings/system`. Note: TenantContext and SystemContext both listen to the **same** `tenants/{tenantId}/settings/system` doc; they overlap by design (settings are surfaced two ways). Keep both in mind when changing that doc's shape.

### Routing & access control (`src/App.jsx`)
Three tiers: **public** (`/login`, `/signup`, `/plans`) → **auth-only** via `ProtectedRoute` (`/onboarding`, `/billing`, `/subscription-expired`) → **auth + valid subscription** via `SubscriptionGuard` wrapping `AppShell` (`/`, `/inventory`, `/transactions`, `/alerts`, `/settings`). `SubscriptionGuard` (`src/components/auth/`) enforces the redirect matrix: no tenant → `/onboarding`, expired/cancelled → `/subscription-expired`, and renders the trial banner.

### Data layer: real-time hooks in `src/hooks/`
Each domain has a hook that opens an `onSnapshot` listener scoped to the current tenant and returns `{ data, loading, error, ...mutators }`: `useInventory`, `useTransactions`, `useBatches`, `useCategories`, `useTradeNames`, `useAlerts`. This is the standard pattern — new collections should follow it.

**Inventory + batches aggregation model** (important, easy to break):
- Items live at `inventory_items/{id}`; each has a `batches` subcollection.
- The item doc caches aggregates (`total_quantity`, `nearest_expiry`, `batch_count`, plus legacy `quantity`) computed from its batches via `computeAggregates` in `useBatches.js`.
- All batch mutations use `runTransaction` to update the batch **and** re-write the parent's aggregates atomically. Preserve this — writing a batch without updating the parent aggregate corrupts inventory totals.
- `useTransactions.recordTransaction` also uses `runTransaction`: adjusts quantity, writes a transaction log, and auto-creates a `LOW_STOCK` alert on threshold crossing. `useAlertSync` is a secondary reconciliation pass over all items.
- Expiry alerts: `src/utils/alertUtils.js` computes `alert_trigger_date = expiry - lead_time` (`calculateAlertDate`).

### i18n & RTL
`src/i18n/i18n.js` (i18next, `en`/`ar` in `src/i18n/locales/`, localStorage key `dental_clinic_lang`). `useDirection` syncs `<html dir/lang>` and font family on language change. **Bilingual data convention:** documents carry parallel `name_en`/`name_ar` (and `message_en`/`message_ar`, `label_en`/`label_ar`) fields; render the pair based on `i18n.language`, don't translate data at runtime.

### UI conventions
- Reusable primitives in `src/components/ui/` (Button, Input, Modal, Card, Table, Toast, Skeleton…). Use `cn()` from `src/lib/utils.js` (clsx + tailwind-merge) for class composition.
- Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config.js` — config is CSS-first in `src/index.css`).
- Dark theme is the design baseline (gray-950 surfaces, cyan-500 accent). Toasts via `useToast()`, not `alert()`.
- Feature-specific components grouped by domain: `src/components/inventory/`, `settings/`, `layout/`, `auth/`.

### Security model
`firestore.rules` enforces tenant isolation server-side: a user can only touch `tenants/{tenantId}/**` when their `users/{uid}.tenantId` matches (owner-based `getAfter` exception for the initial batch write during onboarding). `plans` are public-read; `subscriptions` are backend/Cloud-Function-managed (client write denied). When adding collections, update these rules — the client `dbConfig` paths and the rules must stay in sync.

## Gotchas
- Onboarding (`src/pages/Onboarding.jsx`) provisions a whole tenant tree in one `writeBatch` (tenant root, settings, default categories per store type, 7-day trial sub) then calls `bindTenant`. Firestore rules specifically allow this batched create by the owner — changing the write shape can trip the rules.
- Timestamps are inconsistent: some code uses `new Date().toISOString()` strings, some uses `serverTimestamp()`. Subscription status logic in `TenantContext` handles both (`.toDate?.() ?? new Date(...)`).
- Store-type presets (`STORE_TYPES`, `DEFAULT_CATEGORIES_BY_TYPE`) and transaction/alert enums live in `src/config/dbConfig.js`.
