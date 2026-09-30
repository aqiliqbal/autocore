"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const {
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        throw loginError;
      }

      router.push("/shop");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          <div className="mb-8 text-center">
            <div className="mb-4 text-3xl font-black tracking-tight">
              AUTO<span className="text-[#e5253f]">CORE</span>
            </div>

            <h1 className="text-2xl font-bold">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Login to your AutoCore account.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11151d] p-6 shadow-2xl">

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-white outline-none transition focus:border-[#e5253f]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Your password"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-white outline-none transition focus:border-[#e5253f]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#e5253f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Logging in..."
                  : "Login"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-[#ff334d] hover:text-white"
              >
                Create account
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}