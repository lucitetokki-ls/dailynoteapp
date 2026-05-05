"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarCheck2, CalendarRange, Layers3, Search, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Today",
    icon: CalendarCheck2,
  },
  {
    href: "/review",
    label: "Review",
    icon: BarChart3,
  },
  {
    href: "/category",
    label: "Category",
    icon: Layers3,
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: CalendarRange,
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex items-center gap-1.5 overflow-x-auto rounded-lg border-2 border-zinc-200 bg-white p-1.5 shadow-sm sm:mb-8 sm:gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            className={cn(
              "flex h-11 min-w-11 items-center justify-center gap-2.5 rounded-md px-3 text-base font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 sm:h-12 sm:min-w-12 sm:px-4",
              isActive && "bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white",
            )}
            href={item.href}
            key={item.href}
            title={item.label}
          >
            <Icon aria-hidden="true" size={20} />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
