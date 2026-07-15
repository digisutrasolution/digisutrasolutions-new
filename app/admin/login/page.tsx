import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

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
        <p className="font-display text-center text-xl font-extrabold italic tracking-tight">
          <span className="text-orange-500">DIGI</span>
          <span className="text-stone-800">SUTRA</span>
          <span className="ml-2 align-middle rounded-full bg-stone-900 px-2.5 py-0.5 text-[11px] font-semibold not-italic tracking-normal text-white">
            CMS
          </span>
        </p>
        <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-7 shadow-[0_20px_50px_rgba(124,45,18,0.08)]">
          <h1 className="font-display text-lg font-bold text-stone-900">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Use your team account to access the panel.
          </p>
          <LoginForm nextPath={next && next.startsWith("/") ? next : "/admin"} />
        </div>
        <p className="mt-4 text-center text-xs text-stone-400">
          Protected area — all activity is logged.
        </p>
      </div>
    </div>
  );
}
