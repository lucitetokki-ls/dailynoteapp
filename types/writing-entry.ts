import type { JSONContent } from "@tiptap/core";

export type WritingEntry = {
  id: string;
  date: string;
  content: string;
  contentJson?: JSONContent | null;
  contentMarkdown?: string;
  createdAt: string;
  updatedAt: string;
};
