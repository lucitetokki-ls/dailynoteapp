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
    label: "대시보드",
    icon: CalendarCheck2,
  },
  {
    href: "/review",
    label: "주간 리뷰",
    icon: BarChart3,
  },
  {
    href: "/writing",
    label: "작문",
    icon: PenLine,
  },
  {
    href: "/category",
    label: "카테고리",
    icon: Layers3,
  },
  {
    href: "/calendar",
    label: "캘린더",
    icon: CalendarRange,
  },
  {
    href: "/search",
    label: "검색",
    icon: Search,
  },
  {
    href: "/settings",
    label: "설정",
    icon: Settings,
  },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="mobile-nav mobile-terminal-nav app-nav mb-5 grid grid-cols-4 gap-1.5 rounded-lg border-2 border-zinc-200 bg-white p-1.5 shadow-sm sm:mb-8 sm:flex sm:items-center sm:gap-2 sm:overflow-x-auto"
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
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
