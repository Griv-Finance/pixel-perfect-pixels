# Roadmap

## Dashboard pages (brief: Design Griv Dashboard Pages)
- [x] Shared building blocks (page header, tables, filters, drawers, dialogs, status badges, money formatting, sample data)
- [x] Main menu links + phone menu
- [x] Balances
- [x] Transactions
- [x] Payments
- [x] Transfers
- [x] Payouts
- [x] Payment Links
- [x] Invoices
- [x] Virtual Accounts
- [x] Online Store
- [x] Orders
- [x] Products
- [x] Inventory
- [x] POS
- [ ] Finish browser checks: create flows on Transfers, Payouts, Payment Links, Invoices, Products, Virtual Accounts; tablet and phone layouts (paused at user's request)

## Dashboard redesign (brief: redesign Dashboard page only)
- [x] Three-state preview store + switcher ("Preview dashboard state": new / verified / active)
- [x] Mock data: checklist, quick actions, feature cards, resources, range helpers (src/lib/demo/dashboard.ts)
- [x] New merchant state (verification card, checklist, quick actions, resources)
- [x] Verified merchant state (activation card, checklist, feature cards, limited overview)
- [x] Active merchant state (KPIs vs previous period, money-flow chart, insights, action required, unified ledger)
- [x] Honest preview dialogs for flows not wired up in the demo
- [x] Verify: tests (24 pass incl. 9 new dashboard-state tests), typecheck, browser check of all three states + filters, drawer, honest previews and mobile layout

## Transactions consolidation + Balances redesign (brief: Griv Transactions)
- [x] Sidebar: remove Transfers and Payouts entries; keep their routes, flows and data intact
- [x] Unified Transactions page (type tabs over one merged dataset, New transfer / Create payout / Bulk payout menu, per-type details, /transactions?q= deep link)
- [x] Advanced Filters panel (type, status, method, amount operators, date from/to, reference, payment channel, pay-in type, currency, recipient, account, original reference, keyword; Clear + Apply; draft preserved when collapsed)
- [x] Balances redesign (currency tabs, pending/available overview, Add Funds / Withdraw / Convert actions, Balance History with consistent running balances, prototype Lien History, per-currency export)
- [x] Browser checks of the new Transactions filters and the Balances redesign (desktop + phone)

## Transactions redesign (brief: MailerSend Emails-page reference)
- [x] Header: title + description only; "Show for: All transactions ▼" selector (All / Deposits / Withdrawals / Transfers)
- [x] Filter container: row 1 reference, date-range picker, status, currency; More filters expands to customer, amount min–max, method, channel, provider, source/destination account, transaction ID; Clear filters + Search apply/clear everything
- [x] Table: count + Export (CSV / CSV for Excel) toolbar, Status/Reference/Customer/Type/Amount/Fee/Channel/Date columns, soft status badges, dark failure-reason tooltips
- [x] Pagination: View 10/25/50/100 (default 25), "1–N of total" with disabled prev/next at the edges
- [x] Data: provider + internal TXN id + product origin + failure reasons on every transaction; details drawer shows them
- [x] Tests (39 pass incl. redesign rules), typecheck, browser checks desktop + phone (no console errors)


## Unified dashboard redesign (brief: MailerLite reference)
- [x] Remove three-state preview switcher; one adaptive dashboard for every merchant
- [x] Onboarding checklist (3 tasks, hides when complete) + Performance overview card
- [x] Payments / Balances & settlements / Payment links / Invoices / E-commerce sections with minimal charts, shared period + currency selectors
- [x] Tests updated (dashboard-unified.test.ts, 33 pass)
- [x] Browser check of the unified dashboard (desktop + phone, no console errors)

## Balances — second style preview (Transactions style)
- [x] New page at /balances-preview: same balances data, rebuilt in the MailerSend/Transactions style (Show for currency selector, one filter container with More filters, count + Export toolbar, Balance/Lien History tabs, View 10/25/50/100 pagination footer)
- [x] Original /balances untouched; cross-links between the two designs ("See this page in the Transactions style" / "Original style")
- [x] Typecheck, 39 tests, desktop + phone browser checks (no console errors)

## Payment Link details page redesign (brief: Stripe reference)
- [x] Stripe-style header: breadcrumb, name + "for" price, URL field with copy, Add URL parameters / Embed buy button / Download QR code, ⋯ menu (Change name, Edit, Add note, Copy to live mode, divided Deactivate/Activate with confirmation)
- [x] Overview | Payments and analytics tabs; two-column Overview with tips carousel on the right
- [x] Adaptive Products table (fixed vs preset/min/max vs recurring interval), conditional Shipping, Payment methods with Manage dialogs, dynamic Details, editable Metadata, Events and Logs
- [x] Analytics tab: live metrics + chart, Test-mode "analytics are only available for live data" state, Recent payments with View all deep link to /transactions
- [x] Tests (link-details-rules.test.ts, 49 pass), typecheck, desktop + phone browser checks (no console errors)

## Create/Edit Payment Link workspace (brief: GRIV — Create & Edit Payment Link)
- [ ] Link builder data model + draft store (src/lib/demo/link-builder.ts): builder config from/to PaymentLink, validation, CTA + interval helpers
- [ ] Full-screen workspace route /payment-links/new and /payment-links/$linkId_/edit (top bar, Test/Live indicator, two columns 40/60, mobile Configure/Preview toggle)
- [ ] Payment page tab: Select type (Products or subscriptions / Customers choose what to pay), product picker, selected product cards with qty + adjustable quantity, recommended products, inline interval-mismatch errors
- [ ] Add/Edit product drawer: info + image, More options (statement descriptor, unit label, metadata, marketing features), Recurring/One-off pricing, billing period, additional prices, Show preview panel
- [ ] Flexible payment section: title, description, image, category, tax, currency, preset amount, limits
- [ ] Options: tax, names (optional), business names (optional), addresses (billing / billing+shipping), phone, free trial (recurring only), limit number of payments
- [ ] Advanced options: custom field builder (text / numbers / dropdown + Add options modal with reordering and options-left counter), promotion codes, tax IDs, save payment details, terms, call-to-action select
- [ ] After payment tab: confirmation page vs redirect, custom message, post-payment invoice
- [ ] Live checkout preview (desktop/mobile): merchant identity, line items, recommended add-ons, dynamic customer fields, custom fields, payment methods, CTA, terms, promo codes; confirmation + invoice previews
- [ ] Validation, unsaved-changes guard, create updates linksStore and opens the details page; edit preserves unrelated configuration
- [ ] Rewire list + details entry points to the workspace; retire the old LinkForm dialog
- [ ] Tests (builder rules), typecheck, build, browser checks
