"use client";

import { retrySupabaseMutation, supabase, type SupabaseMutationResult } from "@/lib/supabase";
import type { ActionTemplate } from "@/types/action-template";
import type { ActionCategory } from "@/types/daily-action";

const templateStorageKey = "daily-note:action-templates";

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

type ActionTemplateRow = {
  id: string;
  category: ActionCategory;
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
};

function mapTemplateToRow(template: ActionTemplate): ActionTemplateRow {
  return {
    id: template.id,
    category: template.category,
    title: template.title,
    description: template.description,
  };
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

  if (supabase) {
    void retrySupabaseMutation(() => syncTemplatesToSupabase(templates));
  }
}

function canReadBrowserTemplateStore() {
  return typeof window !== "undefined";
}

async function syncTemplatesToSupabase(
  templates: ActionTemplate[],
): Promise<SupabaseMutationResult> {
  if (!supabase) {
    return { ok: true };
  }

  if (templates.length > 0) {
    const { error } = await supabase
      .from("action_templates")
      .upsert(templates.map(mapTemplateToRow), { onConflict: "id" });

    if (error) {
      console.warn("Failed to save action templates to Supabase", error.message);
      return { ok: false, message: error.message };
    }
  }

  const { data, error } = await supabase
    .from("action_templates")
    .select("id")
    .returns<Array<{ id: string }>>();

  if (error) {
    console.warn("Failed to inspect action templates in Supabase", error.message);
    return { ok: false, message: error.message };
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
      return { ok: false, message: deleteError.message };
    }
  }

  return { ok: true };
}
