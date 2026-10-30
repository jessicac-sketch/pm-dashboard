"use client";

import { LogIn, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { PasswordInput } from "@/components/ui/password-input";
import { ErrorMessage } from "@/components/ui/query-state";
import { useSignIn } from "@/hooks/queries/use-auth";

export const LoginForm = ({ redirectTo }: { redirectTo: string }) => {
  const router = useRouter();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          router.replace(redirectTo);
          // Re-run server components/middleware with the new session cookie.
          router.refresh();
        },
      },
    );
  };

  return (
    <div className="relative z-10 w-full max-w-100 border border-border bg-surface shadow-[0_40px_90px_-10px] shadow-ink/45">
      <div className="flex flex-col gap-7 px-9 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex flex-col items-center gap-2">
            <Logo className="h-9" title="Babaylan" animated />
            <p className="max-w-72 text-xs leading-relaxed text-muted italic">
              Filipino folklore: The guide of the community, who led through knowledge rather than force
            </p>
          </div>
          {/* No visible heading; screen readers still get one for the page. */}
          <h1 className="sr-only">Sign in to Babaylan</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            id="email"
            label="Email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@ntv360.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordInput
            id="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {signIn.error && <ErrorMessage error={signIn.error} />}

          <Button
            type="submit"
            icon={LogIn}
            loading={signIn.isPending}
            disabled={!email.trim() || !password}
            fullWidth
          >
            {signIn.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
};
