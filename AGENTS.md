<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules
- Merchant-group dashboards are standalone full pages under `/merchant-groups` (data in `src/lib/merchant-groups.ts`, UI in `src/components/griv/merchant-groups/`) with their own layout; they never render inside or change the real app layout `AppShell`, so proposals can be compared without affecting the product.
- Preview menus may only list features that exist in the real app menu; a test enforces this so mockups never imply features Griv lacks.
- Standard dashboard pages render through `DashboardPage` (real `AppShell` + breadcrumbs + sample-data notice) and build UI from `src/components/griv/kit`; page-specific code lives in `src/components/griv/pages/<slug>/` and sample data in `src/lib/demo/`, so all pages stay visually consistent and easy to wire to a backend later.
- The dashboard is one unified, MailerLite-inspired page (no state switcher): an onboarding checklist that hides when done, then a Performance overview card whose grey-headed sections (Payments, Balances & settlements, Payment links, Invoices, E-commerce) share one period + currency selector. Data and metric helpers live in `src/lib/demo/dashboard.ts`, UI in `src/components/griv/pages/dashboard/unified/`; flows that don't exist open an honest "not wired up in the demo" dialog.
- There is no backend yet: data shared across pages (balances, catalogue/stock) lives in in-memory stores from `createDemoStore`, so actions on one page (e.g. a POS sale) show up on others.
- Demo money movements (transfers, payouts, refunds, non-cash POS payments) must never reach a final success state client-side; they stay pending until a real server/provider confirms, so the UI never fakes a completed financial operation.
- Status colours come only from `src/lib/status.ts` and money formatting only from `src/lib/money.ts` (amounts are never summed across currencies).
