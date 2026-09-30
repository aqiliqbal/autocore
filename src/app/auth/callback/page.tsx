"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080a0e] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/8 bg-[#0e1117] p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#e5253f]/20 bg-[#e5253f]/10">
          <span className="text-xl text-[#e5253f]">
            ✓
          </span>
        </div>

        <h1 className="font-display text-3xl tracking-wide text-white">
          EMAIL VERIFICATION
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Redirecting to login...
        </p>
      </div>
    </main>
  );
}