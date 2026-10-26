import type { PreviewInfo } from "./PreviewNoticeDialog";

/** Honest previews for flows that exist in the real product but not in this demo. */
export const VERIFY_PREVIEW: PreviewInfo = {
  title: "Business verification",
  description:
    "Real document verification isn't wired up in this demo yet. In the live product this opens the verification flow: upload your CAC certificate, ID and proof of address, then track the review.",
};

export const EXPLORE_PREVIEW: PreviewInfo = {
  title: "Explore Griv",
  description:
    "A guided product tour isn't wired up in this demo yet. In the live product this opens an interactive walkthrough of payments, sales, invoicing and daily operations.",
};
