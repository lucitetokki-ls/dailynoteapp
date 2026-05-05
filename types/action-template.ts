import type { ActionCategory } from "@/types/daily-action";

export type ActionTemplate = {
  id: string;
  category: ActionCategory;
  title: string;
  description: string;
};
