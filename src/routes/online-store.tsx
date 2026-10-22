import { createFileRoute } from "@tanstack/react-router";
import { OnlineStorePage } from "@/components/griv/pages/online-store/OnlineStorePage";
export const Route = createFileRoute("/online-store")({
 head: () => ({ meta: [{title:"Online Store — Griv Finance"},{name:"description",content:"Manage Nova Retail online store."},{property:"og:title",content:"Online Store — Griv Finance"},{property:"og:description",content:"Manage your commerce with Griv."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}] }),
 component: OnlineStorePage,
});
