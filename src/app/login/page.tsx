import { LoginBackground } from "@/components/features/auth/login-background";
import { LoginForm } from "@/components/features/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { next } = await searchParams;
  // Only allow same-origin paths to avoid open redirects.
  const redirectTo = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-7 overflow-hidden bg-login px-4 py-12">
      <LoginBackground />
      <LoginForm redirectTo={redirectTo} />
      <p className="relative z-10 text-xs text-primary-foreground/85">
        © {new Date().getFullYear()} NTV360. All rights reserved.
      </p>
    </main>
  );
};

export default LoginPage;
