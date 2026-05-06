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
    code: "DASH",
    icon: CalendarCheck2,
  },
  {
    href: "/review",
    label: "주간 리뷰",
    code: "REVW",
    icon: BarChart3,
  },
  {
    href: "/writing",
    label: "작문",
    code: "WRIT",
    icon: PenLine,
  },
  {
    href: "/category",
    label: "카테고리",
    code: "CATG",
    icon: Layers3,
  },
  {
    href: "/calendar",
    label: "캘린더",
    code: "CALN",
    icon: CalendarRange,
  },
  {
    href: "/search",
    label: "검색",
    code: "FIND",
    icon: Search,
  },
  {
    href: "/settings",
    label: "설정",
    code: "CONF",
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
      <div className="route-index-caption" aria-hidden="true">
        <span>ROUTE INDEX</span>
        <span>NODE:07</span>
      </div>

      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const routeNumber = String(index + 1).padStart(2, "0");

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
            <span className="route-number" aria-hidden="true">
              {routeNumber}
            </span>
            <span className="route-copy">
              <span className="route-label">{item.label}</span>
              <span className="route-code">{item.code}</span>
            </span>
            <Icon aria-hidden="true" className="route-icon" size={16} />
            <span className="route-status" aria-hidden="true">
              {isActive ? "ACTIVE" : "READY"}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
