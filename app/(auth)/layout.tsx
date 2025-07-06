import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Auth",
  description: "Auth Page",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Enhanced background layers */}
      <div className="absolute inset-0 z-0">
        {/* Primary floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-orange-500/20 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-gradient-to-br from-emerald-400/15 to-teal-300/8 rounded-full blur-3xl animate-pulse delay-2000" />

        {/* Additional accent orbs */}
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-amber-300/10 to-orange-400/5 rounded-full blur-2xl animate-pulse delay-3000" />
        <div className="absolute top-1/6 right-1/6 w-48 h-48 bg-gradient-to-br from-indigo-400/15 to-blue-300/8 rounded-full blur-3xl animate-pulse delay-4000" />
      </div>

      {/* Enhanced grid pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Layered gradients for depth */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(147,51,234,0.08),transparent)]" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_40%_60%_at_20%_80%,rgba(16,185,129,0.06),transparent)]" />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
      </div>

      {/* Enhanced floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-blue-300/40 rounded-full animate-ping delay-1000" />
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-orange-300/40 rounded-full animate-ping delay-2000" />
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-emerald-300/40 rounded-full animate-ping delay-3000" />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-cyan-300/40 rounded-full animate-ping delay-4000" />
      </div>

      {/* Home button - top left */}
      <div className="relative z-20 p-6">
        <Button
          variant="outline"
          size="sm"
          className="bg-slate-800/60 backdrop-blur-md border-slate-600/40 text-slate-300 hover:bg-slate-700/60 hover:text-white hover:border-slate-500/60 transition-all duration-300"
          asChild
        >
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </Button>
      </div>

      {/* Main content - grows to fill space */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Bottom legal text - always at bottom */}
      <div className="relative z-20 pb-8 px-4 p-4">
        <div className="text-center">
          <p className="text-xs text-slate-400/80 max-w-md mx-auto">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
