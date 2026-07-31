import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/site";
import ApiKeysManager from "@/components/admin/ApiKeysManager";
import WebhooksManager from "@/components/admin/WebhooksManager";

export const metadata = { title: "Developers" };

export default async function DevelopersPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "api.manage")) redirect("/admin");

  const base = SITE_URL.replace(/\/+$/, "");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Developers</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Push and read leads over a REST API, and get notified of lead events via
        webhooks — handy for n8n, Zapier or your own tools.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <ApiKeysManager />

        {/* Quick reference */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-display text-sm font-bold">REST API</h2>
          <p className="mt-1 text-xs text-stone-500">Authenticate with <code className="rounded bg-stone-100 px-1 dark:bg-stone-800">Authorization: Bearer &lt;key&gt;</code>.</p>
          <div className="mt-3 space-y-3 text-[11px]">
            <div>
              <p className="font-semibold text-stone-700 dark:text-stone-200">Create a lead</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-stone-900 p-3 font-mono text-[10px] leading-relaxed text-stone-100">{`curl -X POST ${base}/api/v1/leads \\
  -H "Authorization: Bearer dsk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Ada","email":"ada@x.com","services":["SEO"]}'`}</pre>
            </div>
            <div>
              <p className="font-semibold text-stone-700 dark:text-stone-200">List / fetch leads</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-stone-900 p-3 font-mono text-[10px] leading-relaxed text-stone-100">{`GET ${base}/api/v1/leads?limit=50
GET ${base}/api/v1/leads/{id}`}</pre>
            </div>
          </div>
        </div>
      </div>

      <WebhooksManager />
    </div>
  );
}
