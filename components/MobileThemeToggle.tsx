"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type MobileTheme = "light" | "dark";

const storageKey = "daily-note:mobile-theme";
const themeColor = {
  light: "#fcfbf8",
  dark: "#111111",
};

function applyMobileTheme(theme: MobileTheme) {
  document.documentElement.dataset.mobileTheme = theme;
  document.documentElement.style.colorScheme = theme;

  const meta = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
  if (meta) {
    meta.content = themeColor[theme];
  }
}

export function MobileThemeToggle() {
  const [theme, setTheme] = useState<MobileTheme>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(storageKey);
    const nextTheme = storedTheme === "dark" ? "dark" : "light";

    applyMobileTheme(nextTheme);
    window.setTimeout(() => setTheme(nextTheme), 0);
  }, []);

  function selectTheme(nextTheme: MobileTheme) {
    setTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    applyMobileTheme(nextTheme);
  }

  return (
    <div className="mobile-theme-toggle" aria-label="모바일 테마 선택">
      <button
        aria-pressed={theme === "light"}
        className={cn("mobile-theme-toggle-button", theme === "light" && "is-active")}
        onClick={() => selectTheme("light")}
        type="button"
      >
        <Sun aria-hidden="true" size={14} />
        <span>LIGHT</span>
      </button>
      <button
        aria-pressed={theme === "dark"}
        className={cn("mobile-theme-toggle-button", theme === "dark" && "is-active")}
        onClick={() => selectTheme("dark")}
        type="button"
      >
        <Moon aria-hidden="true" size={14} />
        <span>DARK</span>
      </button>
    </div>
  );
}
