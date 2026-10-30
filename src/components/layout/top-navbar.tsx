import { ProfileMenu } from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";

export const TopNavbar = () => (
  <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-end gap-2 border-b border-border bg-surface px-6">
    <ThemeToggle />
    <ProfileMenu />
  </header>
);
