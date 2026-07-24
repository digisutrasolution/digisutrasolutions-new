import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ResetPasswordForm from "@/components/admin/ResetPasswordForm";
import { checkResetToken } from "@/lib/auth/reset";
import { withBase } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

/* Validated on the server before anything renders, so a dead link says why
   immediately instead of after the visitor has typed a new password twice. */
const REASONS: Record<string, string> = {
  invalid: "This reset link is not valid. It may have been altered or already replaced by a newer one.",
  expired: "This reset link has expired. Reset links last 30 minutes.",
  used: "This reset link has already been used.",
  inactive: "This account is deactivated. Ask an administrator to re-enable it.",
};

export default async function AdminResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const check = await checkResetToken(token ?? "");

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
          {check.ok ? (
            <>
              <h1 className="font-display text-lg font-bold text-stone-900">
                Choose a new password
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                This link works once and expires 30 minutes after it was sent.
              </p>
              <ResetPasswordForm token={token ?? ""} />
            </>
          ) : (
            <>
              <h1 className="font-display text-lg font-bold text-stone-900">
                Link no longer works
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {REASONS[check.reason] ?? REASONS.invalid}
              </p>
              <Link
                href="/admin/login"
                className="mt-5 flex w-full items-center justify-center rounded-full bg-[#F26419] py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-orange-600"
              >
                Request a new link
              </Link>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          Protected area — all activity is logged.
        </p>
      </div>
    </div>
  );
}
