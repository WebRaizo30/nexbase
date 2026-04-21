"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiJson, ApiError } from "@/lib/api";
import { setAuthToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiJson<{ token: string }>("/api/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email,
          password,
          name: name.trim() ? name.trim() : undefined,
        }),
      });
      setAuthToken(data.token);
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          typeof err.body === "object" && err.body && "error" in err.body
            ? String((err.body as { error: string }).error)
            : err.message,
        );
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="crt-badge mb-4">NEW NODE</p>
      <h1 className="crt-title text-3xl">Create account</h1>
      <p className="crt-subtitle mt-2 text-sm">
        Already registered?{" "}
        <Link href="/login" className="crt-link font-semibold">
          Log in
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="crt-label">
            Name <span className="font-normal opacity-60">(optional)</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
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
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="crt-input mt-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="crt-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="crt-input mt-2"
          />
          <p className="crt-subtitle mt-1 font-mono text-[0.65rem] uppercase tracking-wider">Min 8 chars</p>
        </div>
        {error ? <p className="crt-alert crt-alert-bad rounded-sm p-3 font-mono text-xs">{error}</p> : null}
        <button type="submit" disabled={loading} className="crt-btn-primary w-full">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
