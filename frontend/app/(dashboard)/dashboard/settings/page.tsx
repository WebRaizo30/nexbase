"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson, ApiError } from "@/lib/api";
import { clearAuthToken } from "@/lib/auth";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ user: User }>("/api/users/profile");
      setUser(data.user);
      setName(data.user.name ?? "");
      setEmail(data.user.email);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (name !== (user?.name ?? "")) body.name = name;
      if (email !== user?.email) body.email = email;
      if (newPassword) {
        body.newPassword = newPassword;
        body.currentPassword = currentPassword;
      }
      if (Object.keys(body).length === 0) {
        setMessage("No changes to save.");
        return;
      }
      const data = await apiJson<{ user: User }>("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setUser(data.user);
      setName(data.user.name ?? "");
      setEmail(data.user.email);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Profile updated.");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          typeof e.body === "object" && e.body && "error" in e.body
            ? String((e.body as { error: string }).error)
            : e.message,
        );
      } else {
        setError("Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setDeleting(true);
    try {
      await apiJson("/api/users/account", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword }),
      });
      clearAuthToken();
      window.location.href = "/";
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          typeof e.body === "object" && e.body && "error" in e.body
            ? String((e.body as { error: string }).error)
            : e.message,
        );
      } else {
        setError("Delete failed");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-10">
      <div>
        <p className="crt-badge mb-3">IDENTITY</p>
        <h1 className="crt-title text-3xl">Settings</h1>
        <p className="crt-subtitle mt-3 text-sm">Update your profile or permanently wipe this node.</p>
      </div>

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crt-muted">Loading…</p>
      ) : null}

      {!loading && user ? (
        <form onSubmit={saveProfile} className="crt-panel space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-phosphor-bright">Profile</h2>
            <span className="crt-badge">{user.role}</span>
          </div>
          <div>
            <label htmlFor="name" className="crt-label">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="crt-input mt-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="crt-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="crt-input mt-2"
            />
          </div>
          <div>
            <label htmlFor="currentPassword" className="crt-label">
              Current password <span className="font-normal opacity-60">(for password change)</span>
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="crt-input mt-2"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="crt-label">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="crt-input mt-2"
            />
          </div>
          {message ? <p className="crt-alert crt-alert-ok rounded-sm p-3 font-mono text-xs">{message}</p> : null}
          {error ? <p className="crt-alert crt-alert-bad rounded-sm p-3 font-mono text-xs">{error}</p> : null}
          <button type="submit" disabled={saving} className="crt-btn-primary w-full disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      ) : null}

      {!loading && user ? (
        <form onSubmit={deleteAccount} className="crt-alert crt-alert-bad space-y-4 rounded-sm p-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.25em]">Danger zone</h2>
          <p className="crt-subtitle text-sm">
            Deleting your account removes your profile and related rows from this database.
          </p>
          <div>
            <label htmlFor="deletePassword" className="crt-label">
              Confirm with password
            </label>
            <input
              id="deletePassword"
              type="password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="crt-input mt-2"
            />
          </div>
          <button type="submit" disabled={deleting} className="crt-btn-ghost border-red-500/40 text-red-600 dark:text-red-400">
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
