"use client";

import { useState } from "react";
import ForgotPasswordForm from "@/components/admin/ForgotPasswordForm";
import LoginForm from "@/components/admin/LoginForm";

/** Holds the sign-in / forgot-password toggle. The login page itself stays a
    server component; only this switch needs state. */
export default function LoginPanel({ nextPath }: { nextPath: string }) {
  const [mode, setMode] = useState<"login" | "forgot">("login");

  if (mode === "forgot") {
    return (
      <>
        <h1 className="font-display text-lg font-bold text-stone-900">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Enter your account email and we&rsquo;ll send you a link to set a new
          password.
        </p>
        <ForgotPasswordForm onBack={() => setMode("login")} />
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-lg font-bold text-stone-900">Sign in</h1>
      <p className="mt-1 text-sm text-stone-500">
        Use your team account to access the panel.
      </p>
      <LoginForm nextPath={nextPath} />
      <button
        onClick={() => setMode("forgot")}
        className="mt-4 cursor-pointer text-sm font-semibold text-orange-700 hover:underline"
      >
        Forgot password?
      </button>
    </>
  );
}
