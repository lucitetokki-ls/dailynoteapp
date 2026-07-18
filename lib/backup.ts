import type { JSONContent } from "@tiptap/core";

import { getSafeLinkHref } from "@/lib/safe-url";
import type { StoredDay } from "@/lib/daily-store";
import type { ActionTemplate } from "@/types/action-template";
import {
  actionCategories,
  dailyActionSlots,
  normalizeActionTitle,
  slotMeta,
  type ActionCategory,
  type ActionStatus,
  type DailyAction,
  type DailyActionSlot,
} from "@/types/daily-action";
import type { WeeklyReflection } from "@/types/weekly-reflection";
import type { WritingEntry } from "@/types/writing-entry";

export const maxBackupFileBytes = 5 * 1024 * 1024;

export type DailyNoteBackup = {
  app: "daily-note-app";
  version: 1 | 2 | 3;
  exportedAt: string;
  days: StoredDay[];
  writingEntries: WritingEntry[];
  templates: ActionTemplate[];
  weeklyReflections: WeeklyReflection[];
};

const maxEntries = {
  actionsPerDay: 100,
  days: 5000,
  templates: 100,
  weeklyReflections: 1000,
  writingEntries: 5000,
} as const;

const maxTextLength = {
  actionDescription: 10_000,
  actionReflection: 10_000,
  actionTitle: 120,
  dailyMood: 32,
  dailyReflection: 20_000,
  templateDescription: 2000,
  templateId: 128,
  templateTitle: 120,
  weeklyField: 20_000,
  writing: 1_000_000,
  writingTitle: 120,
} as const;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const weekPattern = /^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/;
const actionStatuses = new Set<ActionStatus>(["done", "partial", "skipped"]);
const categorySet = new Set<string>(actionCategories);
const slotSet = new Set<string>(dailyActionSlots);
const allowedNodeTypes = new Set([
  "blockquote",
  "bulletList",
  "codeBlock",
  "doc",
  "hardBreak",
  "heading",
  "horizontalRule",
  "listItem",
  "orderedList",
  "paragraph",
  "taskItem",
  "taskList",
  "text",
]);
const allowedMarkTypes = new Set(["bold", "code", "italic", "link", "strike", "underline"]);

function fail(path: string): never {
  throw new Error(`Invalid backup field: ${path}`);
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail(path);
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown, path: string, maximum: number) {
  if (!Array.isArray(value) || value.length > maximum) {
    return fail(path);
  }

  return value;
}

function assertUnique<T>(items: T[], path: string, getKey: (item: T) => string) {
  const keys = items.map(getKey);

  if (new Set(keys).size !== keys.length) {
    fail(path);
  }
}

function asString(value: unknown, path: string, maximum: number, allowEmpty = true) {
  if (
    typeof value !== "string" ||
    value.length > maximum ||
    (!allowEmpty && value.trim().length === 0)
  ) {
    return fail(path);
  }

  return value;
}

function asUuid(value: unknown, path: string) {
  const uuid = asString(value, path, 36, false);

  return uuidPattern.test(uuid) ? uuid : fail(path);
}

function asTimestamp(value: unknown, path: string) {
  const timestamp = asString(value, path, 64, false);

  return Number.isNaN(Date.parse(timestamp)) ? fail(path) : timestamp;
}

function asDate(value: unknown, path: string) {
  const date = asString(value, path, 10, false);

  if (!datePattern.test(date)) {
    return fail(path);
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  return parsed.toISOString().slice(0, 10) === date ? date : fail(path);
}

function asWeekKey(value: unknown, path: string) {
  const weekKey = asString(value, path, 8, false);

  return weekPattern.test(weekKey) ? weekKey : fail(path);
}

function asCategory(value: unknown, path: string): ActionCategory {
  return typeof value === "string" && categorySet.has(value)
    ? (value as ActionCategory)
    : fail(path);
}

function asSlot(value: unknown, path: string): DailyActionSlot | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === "string" && slotSet.has(value)
    ? (value as DailyActionSlot)
    : fail(path);
}

function asStatus(value: unknown, path: string): ActionStatus {
  return typeof value === "string" && actionStatuses.has(value as ActionStatus)
    ? (value as ActionStatus)
    : fail(path);
}

function parseAction(value: unknown, path: string, dailyLogId: string): DailyAction {
  const action = asRecord(value, path);
  const satisfaction = action.satisfaction;
  const parsedDailyLogId = asUuid(action.dailyLogId, `${path}.dailyLogId`);

  if (parsedDailyLogId !== dailyLogId) {
    fail(`${path}.dailyLogId`);
  }

  if (
    typeof satisfaction !== "number" ||
    !Number.isInteger(satisfaction) ||
    satisfaction < 1 ||
    satisfaction > 5
  ) {
    fail(`${path}.satisfaction`);
  }

  const slot = asSlot(action.slot, `${path}.slot`);
  const category = asCategory(action.category, `${path}.category`);

  if (slot && slotMeta[slot].category !== category) {
    fail(`${path}.category`);
  }

  const title = asString(action.title, `${path}.title`, maxTextLength.actionTitle, false);

  return {
    id: asUuid(action.id, `${path}.id`),
    dailyLogId: parsedDailyLogId,
    slot,
    category,
    title: normalizeActionTitle(title, category, slot),
    description: asString(
      action.description,
      `${path}.description`,
      maxTextLength.actionDescription,
    ),
    status: asStatus(action.status, `${path}.status`),
    satisfaction,
    reflection: asString(
      action.reflection,
      `${path}.reflection`,
      maxTextLength.actionReflection,
    ),
    createdAt: asTimestamp(action.createdAt, `${path}.createdAt`),
    updatedAt: asTimestamp(action.updatedAt, `${path}.updatedAt`),
  };
}

function parseStoredDay(value: unknown, index: number): StoredDay {
  const path = `days[${index}]`;
  const day = asRecord(value, path);
  const dailyLog = asRecord(day.dailyLog, `${path}.dailyLog`);
  const id = asUuid(dailyLog.id, `${path}.dailyLog.id`);
  const date = asDate(dailyLog.date, `${path}.dailyLog.date`);
  const actions = asArray(day.actions, `${path}.actions`, maxEntries.actionsPerDay).map(
    (action, actionIndex) => parseAction(action, `${path}.actions[${actionIndex}]`, id),
  );
  const slots = actions.flatMap((action) => (action.slot ? [action.slot] : []));

  if (new Set(slots).size !== slots.length) {
    fail(`${path}.actions`);
  }

  return {
    dailyLog: {
      id,
      date,
      dailyMood: asString(
        dailyLog.dailyMood,
        `${path}.dailyLog.dailyMood`,
        maxTextLength.dailyMood,
      ),
      dailyReflection: asString(
        dailyLog.dailyReflection,
        `${path}.dailyLog.dailyReflection`,
        maxTextLength.dailyReflection,
      ),
      createdAt: asTimestamp(dailyLog.createdAt, `${path}.dailyLog.createdAt`),
      updatedAt: asTimestamp(dailyLog.updatedAt, `${path}.dailyLog.updatedAt`),
    },
    actions,
  };
}

function parseMarks(value: unknown, path: string): JSONContent["marks"] {
  if (value === undefined) {
    return undefined;
  }

  return asArray(value, path, 20).map((rawMark, index) => {
    const markPath = `${path}[${index}]`;
    const mark = asRecord(rawMark, markPath);
    const type = asString(mark.type, `${markPath}.type`, 20, false);

    if (!allowedMarkTypes.has(type)) {
      fail(`${markPath}.type`);
    }

    if (type === "link") {
      const attrs = asRecord(mark.attrs, `${markPath}.attrs`);
      const href = getSafeLinkHref(attrs.href);

      if (!href) {
        fail(`${markPath}.attrs.href`);
      }

      return { type, attrs: { href } };
    }

    return { type };
  });
}

function parseContentNode(value: unknown, path: string, depth = 0): JSONContent {
  if (depth > 50) {
    return fail(path);
  }

  const node = asRecord(value, path);
  const type = asString(node.type, `${path}.type`, 24, false);

  if (!allowedNodeTypes.has(type)) {
    return fail(`${path}.type`);
  }

  const parsed: JSONContent = { type };

  if (node.text !== undefined) {
    parsed.text = asString(node.text, `${path}.text`, maxTextLength.writing);
  }

  if (node.marks !== undefined) {
    parsed.marks = parseMarks(node.marks, `${path}.marks`);
  }

  if (node.attrs !== undefined) {
    const attrs = asRecord(node.attrs, `${path}.attrs`);

    if (type === "heading") {
      const level = Number(attrs.level);
      parsed.attrs = { level: level === 1 || level === 2 ? level : 3 };
    } else if (type === "taskItem") {
      parsed.attrs = { checked: Boolean(attrs.checked) };
    }
  }

  if (node.content !== undefined) {
    parsed.content = asArray(node.content, `${path}.content`, 10_000).map((child, index) =>
      parseContentNode(child, `${path}.content[${index}]`, depth + 1),
    );
  }

  return parsed;
}

function parseWritingEntry(value: unknown, index: number): WritingEntry {
  const path = `writingEntries[${index}]`;
  const entry = asRecord(value, path);
  const content = asString(entry.content, `${path}.content`, maxTextLength.writing);
  const contentMarkdown =
    entry.contentMarkdown === undefined
      ? content
      : asString(entry.contentMarkdown, `${path}.contentMarkdown`, maxTextLength.writing);
  const contentJson =
    entry.contentJson === undefined || entry.contentJson === null
      ? null
      : parseContentNode(entry.contentJson, `${path}.contentJson`);

  if (contentJson && contentJson.type !== "doc") {
    fail(`${path}.contentJson.type`);
  }

  return {
    id: asUuid(entry.id, `${path}.id`),
    date: asDate(entry.date, `${path}.date`),
    title:
      entry.title === undefined
        ? ""
        : asString(entry.title, `${path}.title`, maxTextLength.writingTitle),
    content,
    contentJson,
    contentMarkdown,
    createdAt: asTimestamp(entry.createdAt, `${path}.createdAt`),
    updatedAt: asTimestamp(entry.updatedAt, `${path}.updatedAt`),
  };
}

function parseTemplate(value: unknown, index: number): ActionTemplate {
  const path = `templates[${index}]`;
  const template = asRecord(value, path);

  return {
    id: asString(template.id, `${path}.id`, maxTextLength.templateId, false),
    category: asCategory(template.category, `${path}.category`),
    title: asString(template.title, `${path}.title`, maxTextLength.templateTitle, false),
    description: asString(
      template.description,
      `${path}.description`,
      maxTextLength.templateDescription,
    ),
  };
}

function parseWeeklyReflection(value: unknown, index: number): WeeklyReflection {
  const path = `weeklyReflections[${index}]`;
  const reflection = asRecord(value, path);

  return {
    id: asUuid(reflection.id, `${path}.id`),
    weekKey: asWeekKey(reflection.weekKey, `${path}.weekKey`),
    wins: asString(reflection.wins, `${path}.wins`, maxTextLength.weeklyField),
    blockers: asString(reflection.blockers, `${path}.blockers`, maxTextLength.weeklyField),
    nextFocus: asString(
      reflection.nextFocus,
      `${path}.nextFocus`,
      maxTextLength.weeklyField,
    ),
    createdAt: asTimestamp(reflection.createdAt, `${path}.createdAt`),
    updatedAt: asTimestamp(reflection.updatedAt, `${path}.updatedAt`),
  };
}

export function parseDailyNoteBackup(value: unknown): DailyNoteBackup {
  const backup = asRecord(value, "backup");

  if (
    backup.app !== "daily-note-app" ||
    (backup.version !== 1 && backup.version !== 2 && backup.version !== 3)
  ) {
    fail("backup.header");
  }

  const days = asArray(backup.days, "days", maxEntries.days).map(parseStoredDay);
  const writingEntries = asArray(
    backup.writingEntries ?? [],
    "writingEntries",
    maxEntries.writingEntries,
  ).map(parseWritingEntry);
  const templates = asArray(backup.templates ?? [], "templates", maxEntries.templates).map(
    parseTemplate,
  );
  const weeklyReflections = asArray(
    backup.weeklyReflections ?? [],
    "weeklyReflections",
    maxEntries.weeklyReflections,
  ).map(parseWeeklyReflection);

  assertUnique(days, "days.date", (day) => day.dailyLog.date);
  assertUnique(days, "days.id", (day) => day.dailyLog.id);
  assertUnique(
    days.flatMap((day) => day.actions),
    "days.actions.id",
    (action) => action.id,
  );
  assertUnique(writingEntries, "writingEntries.date", (entry) => entry.date);
  assertUnique(writingEntries, "writingEntries.id", (entry) => entry.id);
  assertUnique(templates, "templates.id", (template) => template.id);
  assertUnique(weeklyReflections, "weeklyReflections.weekKey", (reflection) => reflection.weekKey);
  assertUnique(weeklyReflections, "weeklyReflections.id", (reflection) => reflection.id);

  return {
    app: "daily-note-app",
    version: backup.version,
    exportedAt: asTimestamp(backup.exportedAt, "exportedAt"),
    days,
    writingEntries,
    templates,
    weeklyReflections,
  };
}
