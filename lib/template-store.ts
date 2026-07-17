"use client";

import { retrySupabaseMutation, supabase, type SupabaseMutationResult } from "@/lib/supabase";
import type { ActionTemplate } from "@/types/action-template";
import type { ActionCategory } from "@/types/daily-action";

const templateStorageKey = "daily-note:action-templates";

const defaultActionTemplates: ActionTemplate[] = [
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
    title: "공부한 내용 복습하기",
    description: "핵심 개념과 막힌 점을 짧게 정리하기",
  },
  {
    id: "template-organize",
    category: "organization",
    title: "열린 루프 하나 닫기",
    description: "미뤄둔 일, 공간, 파일 중 하나 정리하기",
  },
  {
    id: "template-relationship",
    category: "relationships",
    title: "먼저 안부 건네기",
    description: "짧더라도 마음을 표현하고 대화하기",
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
