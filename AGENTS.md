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
