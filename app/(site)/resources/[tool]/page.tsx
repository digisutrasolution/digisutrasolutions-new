import { permanentRedirect } from "next/navigation";

/* Old per-tool URLs (/resources/gst-calculator …) now live under
   /free-tools; redirect rather than 404 so no link is lost. */
export default async function ResourcesToolRedirect({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  permanentRedirect(`/free-tools/${tool}`);
}
