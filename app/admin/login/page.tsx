import type { Metadata } from "next";
import Image from "next/image";
import LoginPanel from "@/components/admin/LoginPanel";
import { withBase } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFBF7] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5">
          <Image
            src={withBase("/logo.png")}
            alt="DigiSutra Solutions"
            width={200}
            height={70}
            priority
            className="h-12 w-auto object-contain"
          />
          <span className="rounded-full bg-stone-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            CMS
          </span>
        </div>
        <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-7 shadow-[0_20px_50px_rgba(124,45,18,0.08)]">
          <LoginPanel nextPath={next && next.startsWith("/") ? next : "/admin"} />
        </div>
        <p className="mt-4 text-center text-xs text-stone-400">
          Protected area — all activity is logged.
        </p>
      </div>
    </div>
  );
}
