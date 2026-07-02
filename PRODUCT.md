# Product

## Register

product

## Users

Small-business owners and their staff — pharmacies, clinics, restaurants, supermarkets, and warehouses. Often non-technical, frequently on the shop floor or behind a counter, working in short bursts between customers. Bilingual: Arabic (RTL) and English (LTR), switchable at will. Each business is an isolated tenant; a user manages one business's stock, batches, expiries, and transactions.

The job to be done: know what's in stock, what's running low, and what's about to expire — and record ins/outs fast, without training. Barcode/QR scanning is a core input path, not a nice-to-have.

## Product Purpose

Makhzani (مخزني) is a multi-tenant SaaS inventory management system. It gives small businesses a trustworthy real-time picture of their stock: items, batch-level quantities, nearest-expiry tracking, low-stock and expiry alerts, and a transaction log. Success is an owner trusting the numbers enough to run the business on them — and renewing the subscription because the tool quietly pays for itself.

## Brand Personality

Premium and polished. Makhzani should feel like paid enterprise SaaS, not a free template — high craft, deliberate spacing, considered depth (soft shadows, restrained glow on the cyan accent). Confident and clinical: precise, calm, dependable. The voice is clear and low-jargon; a shop owner never feels talked down to or drowned in features. Three words: **precise, dependable, refined.**

## Anti-references

- **Legacy ERP / spreadsheet UI** (SAP, old POS, dense gray grids, tiny fonts, 2005 enterprise). The whole point is to not feel like intimidating warehouse software. No cramped data walls, no illegible type.
- **Generic AI-SaaS template.** No gradient hero-metric templates, no identical icon-heading-text card grids repeated endlessly, no tiny uppercase tracked eyebrows above every section, no cream/sand default background. If it looks auto-generated, it's wrong.

## Design Principles

- **Trust the numbers.** The data is the product. Totals, expiries, and stock levels must read as accurate and unambiguous at a glance — legibility and correctness beat decoration everywhere they conflict.
- **Fast on the floor.** Optimize for short, repeated, interruption-prone sessions. The common path (scan, record in/out, check low stock) is always the shortest path.
- **Premium restraint.** Craft shows in spacing, depth, and motion — not in ornament. Use glass/glow sparingly and purposefully; one confident cyan accent, not a color parade.
- **Bilingual as a first-class citizen.** Every layout works identically in RTL and LTR. Nothing is an afterthought bolted on for Arabic; direction-neutral properties by default.
- **Calm under load.** Alerts, expiries, and low-stock states inform without alarming. Status color is meaningful and rationed, never anxiety-inducing noise.

## Accessibility & Inclusion

Target **WCAG 2.1 AA**. Body text ≥4.5:1, large text ≥3:1, in both light and dark themes. Full keyboard navigation and visible focus rings (already established via `:focus-visible`). Honor `prefers-reduced-motion` for all animation. Bilingual AR/EN with correct RTL/LTR mirroring is a hard requirement, not an accommodation. Status must never be conveyed by color alone (pair with icon/label) for color-blind users.
