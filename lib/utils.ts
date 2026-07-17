import type { DailyLog } from "@/types/daily-log";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createStableUuid(seed: string) {
  let hex = "";

  for (let block = 0; hex.length < 32; block += 1) {
    let hash = 2166136261;
    const input = `${seed}:${block}`;

    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    hex += (hash >>> 0).toString(16).padStart(8, "0");
  }

  const variant = (8 + (Number.parseInt(hex[16], 16) % 4)).toString(16);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

export function getTodayDateKey() {
  const now = new Date();
  return getDateKey(now);
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDateKeyFromOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return getDateKey(date);
}

export function getRecentDateKeys(count: number) {
  return Array.from({ length: count }, (_, index) => getDateKeyFromOffset(-index));
}

export function addDaysToDateKey(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return getDateKey(date);
}

export function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function addMonthsToMonthKey(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);

  return getMonthKey(date);
}

export function getMonthDateKeys(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDate = new Date(year, month, 0).getDate();

  return Array.from({ length: lastDate }, (_, index) => {
    return getDateKey(new Date(year, month - 1, index + 1));
  });
}

export function formatDisplayMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, 1));
}

export function getWeekKey(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;

  target.setUTCDate(target.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function formatDisplayWeek(weekKey: string) {
  const [year, rawWeek] = weekKey.split("-W");
  return `${year}년 ${Number(rawWeek)}주차`;
}

export function formatDisplayDate(dateKey: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${dateKey}T00:00:00`));
}

export function createEmptyDailyLog(date: string): DailyLog {
  const fallbackTimestamp = `${date}T00:00:00.000Z`;

  return {
    id: createStableUuid(`daily-log:${date}`),
    date,
    dailyMood: "steady",
    dailyReflection: "",
    createdAt: fallbackTimestamp,
    updatedAt: fallbackTimestamp,
  };
}
