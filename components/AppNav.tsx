"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarCheck2,
  CalendarRange,
  Layers3,
  MoreHorizontal,
  PenLine,
  Search,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "대시보드",
    mobileLabel: "대시",
    code: "DASH",
    icon: CalendarCheck2,
  },
  {
    href: "/review",
    label: "주간 리뷰",
    mobileLabel: "리뷰",
    code: "REVW",
    icon: BarChart3,
  },
  {
    href: "/writing",
    label: "작문",
    mobileLabel: "작문",
    code: "WRIT",
    icon: PenLine,
  },
  {
    href: "/category",
    label: "카테고리",
    mobileLabel: "분류",
    code: "CATG",
    icon: Layers3,
  },
  {
    href: "/calendar",
    label: "캘린더",
    mobileLabel: "달력",
    code: "CALN",
    icon: CalendarRange,
  },
  {
    href: "/search",
    label: "검색",
    mobileLabel: "검색",
    code: "FIND",
    icon: Search,
  },
  {
    href: "/settings",
    label: "설정",
    mobileLabel: "설정",
    code: "CONF",
    icon: Settings,
  },
];

const mobilePrimaryHrefs = new Set(["/", "/review", "/writing", "/search"]);
const mobileOverflowItems = navItems.filter((item) => !mobilePrimaryHrefs.has(item.href));

export function AppNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isOverflowActive = mobileOverflowItems.some((item) => item.href === pathname);

  useEffect(() => {
    if (!isMoreOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMoreOpen]);

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
            data-mobile-primary={mobilePrimaryHrefs.has(item.href)}
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
              <span className="route-label-mobile">{item.mobileLabel}</span>
              <span className="route-code">{item.code}</span>
            </span>
            <Icon aria-hidden="true" className="route-icon" size={16} />
            <span className="route-status" aria-hidden="true">
              {isActive ? "ACTIVE" : "READY"}
            </span>
          </Link>
        );
      })}

      <button
        aria-controls="mobile-more-navigation"
        aria-expanded={isMoreOpen}
        className="mobile-nav-link mobile-more-trigger"
        data-active={isOverflowActive || isMoreOpen}
        onClick={() => setIsMoreOpen((current) => !current)}
        type="button"
      >
        <span className="route-copy">
          <span className="route-label-mobile">더보기</span>
        </span>
        <MoreHorizontal aria-hidden="true" className="route-icon" size={16} />
      </button>

      <button
        aria-label="더보기 메뉴 닫기"
        className="mobile-more-backdrop"
        data-open={isMoreOpen}
        onClick={() => setIsMoreOpen(false)}
        tabIndex={isMoreOpen ? 0 : -1}
        type="button"
      />
      <div
        aria-hidden={!isMoreOpen}
        className="mobile-more-panel"
        data-open={isMoreOpen}
        id="mobile-more-navigation"
      >
        <div className="mobile-more-panel-heading">
          <span>추가 메뉴</span>
          <span>ROUTE 05-07</span>
        </div>
        {mobileOverflowItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className="mobile-more-link"
              data-active={isActive}
              href={item.href}
              key={`more-${item.href}`}
              onNavigate={() => setIsMoreOpen(false)}
              tabIndex={isMoreOpen ? 0 : -1}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
              <span className="mobile-more-code">{item.code}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
