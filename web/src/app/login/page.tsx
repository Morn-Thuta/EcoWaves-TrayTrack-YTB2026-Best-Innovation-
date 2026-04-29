"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
      {/* Logo mark */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl mb-5">
          <span className="text-3xl">🍽</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-wide uppercase">
          Tray Monitor
        </h1>
        <p className="text-gray-500 text-sm mt-1">Hotel Breakfast Buffet System</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-5">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@hotel.com"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-green-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-gray-800 border-gray-700 text-white focus:border-green-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-800/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-5 transition-all duration-150 hover:brightness-110 active:scale-95"
          >
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
