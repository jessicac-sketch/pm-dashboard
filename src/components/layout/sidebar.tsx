"use client";

import { FileChartColumn, FolderKanban, LayoutDashboard, Receipt, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resources", label: "Resources", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: FileChartColumn },
];

const STORAGE_KEY = "sidebar-collapsed";

export const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Restore the last choice after hydration so server and client render the same first.
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {
      // Storage can be blocked (private mode); the sidebar just starts expanded.
    }
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {
        // Not remembered, but the toggle still works.
      }
      return !c;
    });

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ${collapsed ? "w-16" : "w-60"}`}
    >
      {/* Same height as the top navbar so their bottom borders line up. Clicking the logo collapses or expands the sidebar. */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`flex h-16 w-full items-center gap-2 border-b border-border hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${collapsed ? "justify-center" : "px-4"}`}
      >
        {collapsed ? <Logo variant="mark" fill={1} className="size-8" /> : <Logo fill={1} className="h-5" />}
      </button>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-2 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 border-l-2 py-2 text-sm ${collapsed ? "justify-center px-0" : "px-3"} ${
                active ? "border-primary bg-accent font-semibold text-primary" : "border-transparent text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
