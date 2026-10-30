"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser, useSignOut } from "@/hooks/queries/use-auth";

export const ProfileMenu = () => {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const signOut = useSignOut();

  if (!user) return null;

  const email = user.email ?? "";
  const displayName = (user.user_metadata?.full_name as string | undefined) ?? email.split("@")[0];

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => {
        router.replace("/login");
        router.refresh();
      },
    });
  };

  return (
    <DropdownMenu
      label="Open profile menu"
      trigger={
        <>
          <Avatar name={displayName} />
          <span className="hidden flex-col items-start leading-tight sm:flex">
            <span className="text-sm font-bold">{displayName}</span>
            <span className="text-xs text-muted">{email}</span>
          </span>
          <ChevronDown className="size-4 text-muted" aria-hidden />
        </>
      }
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar name={displayName} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
          <p className="truncate text-xs text-muted">{email}</p>
        </div>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={LogOut} onSelect={handleSignOut} disabled={signOut.isPending}>
        {signOut.isPending ? "Signing out…" : "Sign out"}
      </DropdownMenuItem>
    </DropdownMenu>
  );
};
