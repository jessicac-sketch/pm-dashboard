"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/queries/use-auth";
import { ProjectCreateDialog } from "../projects/project-create-dialog";

const partOfDay = (hour: number) => (hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening");

export const DashboardGreeting = () => {
  const user = useCurrentUser();
  const [creating, setCreating] = useState(false);
  const fullName = (user.data?.user_metadata?.full_name as string | undefined) ?? user.data?.email?.split("@")[0] ?? "";
  const firstName = fullName.split(/\s+/)[0];

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="flex items-center gap-2 text-xs font-black tracking-[0.16em] text-highlight">
          <span className="size-2 bg-highlight" aria-hidden />
          DASHBOARD
        </p>
        {/* The user loads in the browser, so the greeting (and its time of day) is only shown once it has. */}
        <h1 className="mt-1.5 mb-1 min-h-9 text-[28px] font-black">
          {user.data && `Good ${partOfDay(new Date().getHours())}${firstName ? `, ${firstName}` : ""}`}
        </h1>
        <p className="text-sm text-muted">Your projects at a glance: progress, staffing and late work.</p>
      </div>
      <Button icon={Plus} onClick={() => setCreating(true)}>
        New project
      </Button>
      <ProjectCreateDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
};
