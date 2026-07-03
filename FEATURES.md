# Makhzani (مخزني) — Feature Documentation

Multi-tenant SaaS inventory management system for small businesses (pharmacies, clinics, restaurants, supermarkets, warehouses). Bilingual Arabic/English with RTL/LTR switching. React 19 + Vite 8 SPA on Firebase (Auth + Firestore + Storage + Cloud Messaging).

See `PRODUCT.md` for vision/brand, `DESIGN.md` for system design spec, `CLAUDE.md` for dev/architecture guidance.

## Tech Stack

- **Frontend:** React 19, Vite 8, react-router-dom 7, Tailwind CSS 4 (CSS-first config, no `tailwind.config.js`), Framer Motion, Recharts (lazy-loaded)
- **Backend:** Firebase — Auth, Firestore (real-time via `onSnapshot`), Storage, Cloud Messaging
- **i18n:** react-i18next, `en`/`ar` locales
- **Scanning/codes:** html5-qrcode (camera), jsbarcode + qrcode.react (generation)
- **UI:** react-select, lucide-react / react-icons, custom primitives in `src/components/ui/`
- **Hosting:** Vercel (SPA rewrite via `vercel.json`)

## Multi-Tenancy

Every business is isolated under `tenants/{tenantId}/...` in Firestore. Global (non-tenant) collections: `users`, `plans`, `subscriptions`. Tenant sub-collections: `inventory_items` (each with a `batches` subcollection), `categories`, `trade_names`, `transactions`, `alerts`, plus a `settings/system` doc. All paths flow through `src/config/dbConfig.js` — never hardcoded elsewhere.

Store-type presets (`STORE_TYPES`): pharmacy, clinic, restaurant, supermarket, warehouse, general — each seeded with default categories (`DEFAULT_CATEGORIES_BY_TYPE`) at onboarding.

## Auth & Onboarding

- Email/password auth via Firebase Auth (`AuthContext`), creates a `users/{uid}` profile (role: owner, language preference) on first login.
- `Onboarding.jsx`: multi-step wizard (store type → store info → currency → done) that provisions the entire tenant tree — tenant root, settings, default categories, 7-day trial subscription — in one atomic `writeBatch`, then calls `bindTenant`.
- Route guards: `ProtectedRoute` (auth-only: onboarding, billing, subscription-expired) and `SubscriptionGuard` (auth + valid subscription: dashboard, inventory, transactions, alerts, settings) redirect per state — no tenant → onboarding, expired/cancelled → subscription-expired page, shows trial-days-remaining banner.

## Inventory & Batch Tracking

- Items (`inventory_items`) each carry cached aggregates — `total_quantity`, `nearest_expiry`, `batch_count` — computed from an underlying `batches` subcollection (`useBatches.js`, `computeAggregates`).
- All batch mutations (add/adjust/remove batch) run inside a Firestore `runTransaction` that updates the batch **and** rewrites the parent item's aggregates atomically, keeping totals correct.
- Lookup lists: categories (`useCategories`) and trade names (`useTradeNames`) with name-normalization dedup.
- Components: `InventoryModal`, `BatchManagementPanel`, `CategorySelect`, `TradeNameSelect`, `RestockModal`, `DeleteConfirmModal`, plus scan/code modals below. `Inventory.jsx` provides search and filtering over the item list.

## Transactions

- `useTransactions.recordTransaction` records IN/OUT stock movements atomically (`runTransaction`): adjusts quantity, writes a transaction log entry, and auto-creates a `LOW_STOCK` alert when the configured threshold is crossed.
- `useQuickDispense` — fast scan-to-dispense flow with an audible success beep (Web Audio API).
- `useRestockScan` — matches a scanned barcode to an existing item and confirms a restock (new batch + quantity increment).
- `Transactions.jsx` lists paginated transaction history with filters. `ItemTransactionHistory` shows per-item history.

## Alerts

- `useAlerts` streams the `alerts` collection with read/unread state (`markAsRead`).
- `useAlertSync` is a reconciliation pass comparing current inventory state against alert docs, generating `LOW_STOCK` and `EXPIRING_SOON` alerts without duplicating existing ones.
- Expiry alerts computed via `alert_trigger_date = expiry_date - lead_time` (`calculateAlertDate` in `src/utils/alertUtils.js`), with configurable lead-time unit (days/weeks/months) per tenant.
- `Alerts.jsx` renders unread/read lists with type-specific icons.

## Barcode & QR Scanning

- `useBarcodeScanner` — detects handheld/keyboard-emulating scanner input via inter-keystroke timing heuristics, with per-scan dedup cooldown.
- `CameraScannerModal` — camera-based scanning via html5-qrcode, for devices without a hardware scanner.
- `BarcodeModal` / `QRCodeModal` — generate printable barcodes/QR codes for items (jsbarcode, qrcode.react).

## Settings

- `Settings.jsx` + `EditProfileModal` (user profile: name, language) and `EditSystemModal` (tenant settings: store name EN/AR, logo, currency, timezone, low-stock threshold, expiry lead time/unit, brand color).
- `SystemContext` and `TenantContext` both stream the same `tenants/{tenantId}/settings/system` doc — intentionally overlapping surfaces for different consumers (system config vs. subscription/tenant state).

## Billing / Subscription

- `subscriptions` collection is backend/Cloud-Function-managed — client writes denied by `firestore.rules`.
- `TenantContext` exposes `subscriptionStatus`, `isSubscriptionValid`, `trialDaysRemaining`; `SubscriptionGuard` enforces access based on these.
- `Billing.jsx` page for plan/subscription management (Paymob integration referenced, payment flow pending backend wiring). `plans` collection is public-read.

## i18n & RTL

- Full parallel `en`/`ar` locale files (`src/i18n/locales/`) covering nav, dashboard, inventory, transactions, alerts, settings, billing, auth, and common actions.
- Bilingual data convention: documents store parallel `name_en`/`name_ar` (and `message_en`/`message_ar`, `label_en`/`label_ar`) fields — rendered by current language, never translated at runtime.
- `useDirection` syncs `<html dir/lang>` and swaps font family (Noto Kufi Arabic for RTL) on language change. Language persisted to localStorage (`dental_clinic_lang`).

## UI / Theming

- Dark theme is the design baseline (gray-950 surfaces, cyan-500 accent); light theme also supported and persisted via `ThemeContext` + localStorage.
- Reusable primitive kit in `src/components/ui/`: Button, Card, Input, Modal, Table, Toast, Skeleton, AnimatedNumber, LanguageToggle, Typography, Section.
- Layout shell: `AppShell`, `Navbar`, `Sidebar` (`src/components/layout/`).
- Toasts via `useToast()` — no native `alert()` usage.
- Accessibility target: WCAG 2.1 AA, full keyboard nav, `prefers-reduced-motion` honored, status never conveyed by color alone.

## Security

`firestore.rules` enforces tenant isolation server-side:
- A user can only read/write `tenants/{tenantId}/**` when their own `users/{uid}.tenantId` matches, with an owner-based exception (`getAfter`) allowing the initial onboarding batch write.
- `plans`: public read, no client write.
- `subscriptions`: authenticated read-only, writes reserved for backend/Cloud Functions.
- Client-side collection paths (`dbConfig.js`) and these rules are kept in sync by convention — any new collection needs both updated.

## Known Gotchas (see CLAUDE.md)

- Timestamps inconsistent across the codebase: some `new Date().toISOString()` strings, some `serverTimestamp()`. Subscription logic handles both.
- Onboarding's single atomic `writeBatch` shape is tightly coupled to what `firestore.rules` permits — changing it risks breaking the rule exception.
- No test suite currently in the repo.
