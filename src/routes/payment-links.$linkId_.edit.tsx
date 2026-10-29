import { createFileRoute, notFound } from "@tanstack/react-router";
import { LinkBuilderWorkspace } from "@/components/griv/pages/payment-links/builder/Workspace";
import { getLink } from "@/lib/demo/payment-links";

export const Route = createFileRoute("/payment-links/$linkId_/edit")({
  head: () => ({
    meta: [
      { title: "Edit payment link — Griv Finance" },
      { name: "description", content: "Update a Griv payment link's products, options and after-payment settings." },
      { property: "og:title", content: "Edit payment link — Griv Finance" },
      { property: "og:description", content: "Update a Griv payment link's products, options and after-payment settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ params }) => {
    const link = getLink(params.linkId);
    if (!link) throw notFound();
    return { link };
  },
  component: EditRoute,
});

function EditRoute() {
  const { link } = Route.useLoaderData();
  return <LinkBuilderWorkspace link={link} />;
}
