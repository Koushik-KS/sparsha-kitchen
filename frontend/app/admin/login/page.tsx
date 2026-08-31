"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api";

type LoginResponse = {
  success: boolean;
  message?: string;
  token?: string;
  admin?: {
    id: string;
    email: string;
  };
};

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to login."
        );
      }

      if (!data.token) {
        throw new Error(
          "Login succeeded but no authentication token was returned."
        );
      }

      localStorage.setItem("adminToken", data.token);

      if (data.admin) {
        localStorage.setItem(
          "admin",
          JSON.stringify(data.admin)
        );
      }

      router.push("/admin");
    } catch (err) {
      console.error("Admin login error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-orange-50 text-zinc-900">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="text-3xl font-bold tracking-tight text-orange-600">
              Sparsha Kitchen
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              Admin Panel
            </p>
          </div>

          <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm sm:p-9">
            <div>
              <p className="font-semibold uppercase tracking-wide text-orange-600">
                Admin Login
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Welcome back
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Sign in to manage Sparsha Kitchen.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-zinc-800"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Admin email"
                  autoComplete="email"
                  required
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-zinc-800"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Admin password"
                  autoComplete="current-password"
                  required
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-orange-600 px-6 py-3.5 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-100 pt-5 text-center">
              <Link
                href="/"
                className="text-sm font-medium text-zinc-500 hover:text-orange-600"
              >
                ← Back to website
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-400">
            Sparsha Kitchen Admin
          </p>
        </div>
      </div>
    </main>
  );
}