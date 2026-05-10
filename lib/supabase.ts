import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const requiredSupabaseTables = [
  "daily_logs",
  "daily_actions",
  "weekly_reflections",
  "daily_writings",
  "action_templates",
] as const;

function getSupabaseConfigIssue() {
  if (!supabaseUrl || !supabasePublishableKey) {
    return ".env.local에 Supabase URL과 publishable key가 필요합니다.";
  }

  try {
    const parsedUrl = new URL(supabaseUrl);

    if (parsedUrl.protocol !== "https:") {
      return "Supabase URL은 https://로 시작해야 합니다.";
    }
  } catch {
    return "Supabase URL 형식이 올바르지 않습니다.";
  }

  if (
    supabasePublishableKey.startsWith("sb_secret_") ||
    supabasePublishableKey.includes("service_role")
  ) {
    return "브라우저에 노출되는 NEXT_PUBLIC 값에는 secret/service_role key를 넣으면 안 됩니다.";
  }

  return null;
}

export const supabaseConfigIssue = getSupabaseConfigIssue();
export const isSupabaseConfigured = !supabaseConfigIssue;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!)
  : null;

export type SupabaseMutationResult = {
  ok: boolean;
  message?: string;
};

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function formatSupabaseError(error: unknown) {
  if (!error) {
    return "Unknown Supabase error";
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return String(error);
}

function isRetryableSupabaseMessage(message = "") {
  return /failed to fetch|fetch failed|network|timeout|temporar|503|520/i.test(message);
}

export async function retrySupabaseMutation(
  operation: () => Promise<SupabaseMutationResult>,
  attempts = 3,
) {
  let lastResult: SupabaseMutationResult = {
    ok: false,
    message: "Supabase request was not attempted.",
  };

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      lastResult = await operation();
    } catch (error) {
      lastResult = {
        ok: false,
        message: formatSupabaseError(error),
      };
    }

    if (
      lastResult.ok ||
      attempt === attempts ||
      !isRetryableSupabaseMessage(lastResult.message)
    ) {
      return lastResult;
    }

    await wait(600 * 2 ** (attempt - 1));
  }

  return lastResult;
}
