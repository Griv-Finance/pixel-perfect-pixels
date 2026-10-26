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
- [ ] Browser checks of the new Transactions filters and the Balances redesign (desktop + phone)

