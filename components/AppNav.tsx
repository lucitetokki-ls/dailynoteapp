"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck2,
  CalendarRange,
  Layers3,
  PenLine,
  Search,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: CalendarCheck2,
  },
  {
    href: "/review",
    label: "Review",
    icon: BarChart3,
  },
  {
    href: "/writing",
    label: "Writing",
    icon: PenLine,
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
    <nav
      aria-label="Main navigation"
      className="mobile-nav app-nav mb-5 grid grid-cols-4 gap-1.5 rounded-lg border-2 border-zinc-200 bg-white p-1.5 shadow-sm sm:mb-8 sm:flex sm:items-center sm:gap-2 sm:overflow-x-auto"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            data-active={isActive}
            data-tooltip={item.label}
            className={cn(
              "mobile-nav-link flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[0.7rem] font-semibold leading-none text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 sm:h-12 sm:min-w-12 sm:flex-row sm:gap-2.5 sm:px-4 sm:text-base",
              isActive && "bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white",
            )}
            href={item.href}
            key={item.href}
            title={item.label}
          >
            <Icon aria-hidden="true" size={19} />
            <span>&quot;{item.label}&quot;</span>
          </Link>
        );
      })}
    </nav>
  );
}
