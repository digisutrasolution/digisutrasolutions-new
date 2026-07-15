"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, KeyRound, Trash2 } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import type { Role } from "@prisma/client";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
};

const ROLES = Object.keys(ROLE_LABELS) as Role[];

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function UsersManager({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(path: string, init: RequestInit): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(withBase(path), {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Request failed.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const ok = await call("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (ok) {
      form.reset();
      setShowCreate(false);
    }
  }

  function resetPassword(u: UserRow) {
    const password = window.prompt(
      `New password for ${u.email} (min 10 characters):`,
    );
    if (!password) return;
    void call(`/api/users/${u.id}`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
    });
  }

  function removeUser(u: UserRow) {
    if (!window.confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    void call(`/api/users/${u.id}`, { method: "DELETE" });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
        >
          <UserPlus size={15} aria-hidden />
          {showCreate ? "Close" : "Add user"}
        </button>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 dark:border-stone-800 dark:bg-stone-900"
        >
          <div>
            <label htmlFor="new-name" className="mb-1 block text-xs font-semibold">Name</label>
            <input id="new-name" name="name" required minLength={2} className={inputCls} />
          </div>
          <div>
            <label htmlFor="new-email" className="mb-1 block text-xs font-semibold">Email</label>
            <input id="new-email" name="email" type="email" required className={inputCls} />
          </div>
          <div>
            <label htmlFor="new-password" className="mb-1 block text-xs font-semibold">Password</label>
            <input id="new-password" name="password" type="password" required minLength={10} className={inputCls} />
          </div>
          <div>
            <label htmlFor="new-role" className="mb-1 block text-xs font-semibold">Role</label>
            <div className="flex gap-2">
              <select id="new-role" name="role" defaultValue="DEVELOPER" className={inputCls}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy}
                className="shrink-0 cursor-pointer rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-60 dark:bg-orange-600"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Last login</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-stone-100 last:border-0 dark:border-stone-800"
              >
                <td className="px-5 py-3">
                  <p className="font-medium">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                        you
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{u.email}</p>
                </td>
                <td className="px-5 py-3">
                  <select
                    value={u.role}
                    disabled={busy}
                    aria-label={`Role for ${u.email}`}
                    onChange={(e) =>
                      void call(`/api/users/${u.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ role: e.target.value }),
                      })
                    }
                    className="cursor-pointer rounded-lg border border-stone-200 bg-transparent px-2 py-1 text-xs dark:border-stone-700"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <button
                    disabled={busy}
                    onClick={() =>
                      void call(`/api/users/${u.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ isActive: !u.isActive }),
                      })
                    }
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      u.isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400"
                    }`}
                  >
                    {u.isActive ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-5 py-3 text-xs text-stone-500 dark:text-stone-400">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Never"}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => resetPassword(u)}
                      disabled={busy}
                      aria-label={`Reset password for ${u.email}`}
                      title="Reset password"
                      className="cursor-pointer rounded-lg p-2 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                    >
                      <KeyRound size={15} aria-hidden />
                    </button>
                    <button
                      onClick={() => removeUser(u)}
                      disabled={busy || u.id === currentUserId}
                      aria-label={`Delete ${u.email}`}
                      title={u.id === currentUserId ? "You cannot delete yourself" : "Delete user"}
                      className="cursor-pointer rounded-lg p-2 text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-stone-800"
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
