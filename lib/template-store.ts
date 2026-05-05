"use client";

import { useEffect, useSyncExternalStore } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { createId } from "@/lib/utils";
import type { ActionTemplate } from "@/types/action-template";
import type { ActionCategory } from "@/types/daily-action";

const templateStorageKey = "daily-note:action-templates";
const templateEventName = "daily-note-template-change";

export const defaultActionTemplates: ActionTemplate[] = [
  {
    id: "template-walk",
    category: "diet_fitness",
    title: "30분 걷기",
    description: "가볍게라도 몸을 움직이기",
  },
  {
    id: "template-code",
    category: "vibe_coding",
    title: "작은 기능 하나 구현",
    description: "완성보다 실행에 집중",
  },
  {
    id: "template-write",
    category: "writing",
    title: "문장 5개 쓰기",
    description: "초안 품질은 신경 쓰지 않기",
  },
];

let templateVersion = 0;
let templatesLoadedFromSupabase = false;
let isClientTemplateStoreReady = false;

type ActionTemplateRow = {
  id: string;
  category: ActionCategory;
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
};

function emitTemplateChange() {
  templateVersion += 1;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(templateEventName));
  }
}

function mapTemplateRow(row: ActionTemplateRow): ActionTemplate {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
  };
}

function mapTemplateToRow(template: ActionTemplate): ActionTemplateRow {
  return {
    id: template.id,
    category: template.category,
    title: template.title,
    description: template.description,
  };
}

function subscribeToTemplates(onStoreChange: () => void) {
  window.addEventListener(templateEventName, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(templateEventName, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getTemplateSnapshot() {
  if (!canReadBrowserTemplateStore()) {
    return "server";
  }

  return `${templateVersion}:${window.localStorage.length}`;
}

function getServerSnapshot() {
  return "server";
}

export function readActionTemplates() {
  if (!canReadBrowserTemplateStore()) {
    return defaultActionTemplates;
  }

  const raw = window.localStorage.getItem(templateStorageKey);

  if (!raw) {
    return defaultActionTemplates;
  }

  try {
    return JSON.parse(raw) as ActionTemplate[];
  } catch {
    return defaultActionTemplates;
  }
}

export function writeActionTemplates(templates: ActionTemplate[]) {
  window.localStorage.setItem(templateStorageKey, JSON.stringify(templates));
  emitTemplateChange();

  if (supabase) {
    void syncTemplatesToSupabase(templates);
  }
}

export function useActionTemplates() {
  useSyncExternalStore(subscribeToTemplates, getTemplateSnapshot, getServerSnapshot);
  useEffect(() => {
    markClientTemplateStoreReady();
    void syncTemplatesFromSupabase();
  }, []);
  return readActionTemplates();
}

function markClientTemplateStoreReady() {
  if (typeof window === "undefined" || isClientTemplateStoreReady) {
    return;
  }

  isClientTemplateStoreReady = true;
  emitTemplateChange();
}

function canReadBrowserTemplateStore() {
  return typeof window !== "undefined";
}

export function createActionTemplate(input: Omit<ActionTemplate, "id">) {
  writeActionTemplates([
    {
      id: createId(),
      ...input,
    },
    ...readActionTemplates(),
  ]);
}

export function deleteActionTemplate(id: string) {
  writeActionTemplates(readActionTemplates().filter((template) => template.id !== id));
}

export function resetActionTemplates() {
  writeActionTemplates(defaultActionTemplates);
}

async function syncTemplatesFromSupabase() {
  if (!isSupabaseConfigured || !supabase || templatesLoadedFromSupabase) {
    return;
  }

  templatesLoadedFromSupabase = true;

  const { data, error } = await supabase
    .from("action_templates")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<ActionTemplateRow[]>();

  if (error) {
    console.warn("Failed to fetch action templates from Supabase", error.message);
    return;
  }

  if (data && data.length > 0) {
    window.localStorage.setItem(templateStorageKey, JSON.stringify(data.map(mapTemplateRow)));
    emitTemplateChange();
    return;
  }

  await syncTemplatesToSupabase(readActionTemplates());
}

async function syncTemplatesToSupabase(templates: ActionTemplate[]) {
  if (!supabase) {
    return;
  }

  if (templates.length > 0) {
    const { error } = await supabase
      .from("action_templates")
      .upsert(templates.map(mapTemplateToRow), { onConflict: "id" });

    if (error) {
      console.warn("Failed to save action templates to Supabase", error.message);
      return;
    }
  }

  const { data, error } = await supabase
    .from("action_templates")
    .select("id")
    .returns<Array<{ id: string }>>();

  if (error) {
    console.warn("Failed to inspect action templates in Supabase", error.message);
    return;
  }

  const localIds = new Set(templates.map((template) => template.id));
  const idsToDelete = (data ?? []).map((row) => row.id).filter((id) => !localIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("action_templates")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      console.warn("Failed to delete action templates from Supabase", deleteError.message);
    }
  }
}
