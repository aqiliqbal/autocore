"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

 async function handleSignup(event: FormEvent) {
  event.preventDefault();

  setError("");
  setSuccess("");

  if (!fullName.trim()) {
    setError("Please enter your full name.");
    return;
  }

  if (!email.trim()) {
    setError("Please enter your email.");
    return;
  }

  if (password.length < 6) {
    setError("Password must be at least 6 characters.");
    return;
  }

  setLoading(true);

  try {
    const supabase = createClient();

    const { data, error: signupError } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            fullName: fullName.trim(),
          },
          emailRedirectTo:
            "http://localhost:3000/auth/callback",
        },
      });

    if (signupError) {
      throw signupError;
    }

    if (!data.user) {
      throw new Error("Unable to create account.");
    }

    setSuccess(
      "Account created successfully. Please check your email and click the verification link."
    );

    setTimeout(() => {
      router.push("/login");
    }, 2000);
  } catch (error) {
    console.error("Signup error:", error);

    setError(
      error instanceof Error
        ? error.message
        : "Unable to create account."
    );
  } finally {
    setLoading(false);
  }
}

  async function handleResendVerification() {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const supabase = createClient();

      const {
        error: resendError,
      } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo:
            `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) {
        throw resendError;
      }

      setSuccess(
        "Verification email has been sent again. Please check your inbox."
      );
    } catch (error) {
      console.error(
        "Resend verification error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to resend verification email."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------
     VERIFICATION SUCCESS SCREEN
  ---------------------------------------- */

  if (verificationSent) {
    return (
      <main className="min-h-screen bg-[#090b10] text-white">
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">

            <div className="mb-8 text-center">

              <div className="mb-4 text-3xl font-black tracking-tight">
                AUTO
                <span className="text-[#e5253f]">
                  CORE
                </span>
              </div>

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                <span className="text-2xl text-emerald-400">
                  ✓
                </span>
              </div>

              <h1 className="text-2xl font-bold">
                CHECK YOUR EMAIL
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                We sent a verification link to:
              </p>

              <p className="mt-2 break-all text-sm font-medium text-white">
                {email.trim().toLowerCase()}
              </p>

            </div>

            <div className="rounded-2xl border border-white/10 bg-[#11151d] p-6 shadow-2xl">

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
                <p className="text-sm leading-6 text-emerald-400">
                  Please open the email and click the
                  verification link to activate your
                  AutoCore account.
                </p>
              </div>

              <div className="mt-5 space-y-3">

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Sending..."
                    : "Resend Verification Email"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/login")
                  }
                  className="w-full rounded-xl bg-[#e5253f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d]"
                >
                  Go to Login
                </button>

              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
                  {success}
                </div>
              )}

            </div>

          </div>
        </div>
      </main>
    );
  }

  /* ----------------------------------------
     SIGNUP FORM
  ---------------------------------------- */

  return (
    <main className="min-h-screen bg-[#090b10] text-white">

      <div className="flex min-h-screen items-center justify-center px-4 py-10">

        <div className="w-full max-w-md">

          {/* HEADER */}
          <div className="mb-8 text-center">

            <div className="mb-4 text-3xl font-black tracking-tight">
              AUTO
              <span className="text-[#e5253f]">
                CORE
              </span>
            </div>

            <h1 className="text-2xl font-bold">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Create an account to shop automotive
              parts.
            </p>

          </div>

          {/* CARD */}
          <div className="rounded-2xl border border-white/10 bg-[#11151d] p-6 shadow-2xl">

            {/* ERROR */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleSignup}
              className="space-y-4"
            >

              {/* FULL NAME */}
              <div>

                <label className="mb-2 block text-sm text-zinc-400">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your name"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#e5253f] disabled:opacity-50"
                />

              </div>

              {/* EMAIL */}
              <div>

                <label className="mb-2 block text-sm text-zinc-400">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#e5253f] disabled:opacity-50"
                />

              </div>

              {/* PASSWORD */}
              <div>

                <label className="mb-2 block text-sm text-zinc-400">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Minimum 6 characters"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0e13] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#e5253f] disabled:opacity-50"
                />

              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#e5253f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff334d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>

            </form>

            {/* LOGIN */}
            <div className="mt-6 text-center text-sm text-zinc-500">

              Already have an account?{" "}

              <Link
                href="/login"
                className="font-medium text-[#ff334d] hover:text-white"
              >
                Login
              </Link>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}