import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { WritingStudio } from "@/components/WritingStudio";

export const metadata: Metadata = {
  title: "Writing",
  description: "Daily writing space for Lucitetokki Daily Action Log.",
};

export default function WritingPage() {
  return (
    <AppShell>
      <WritingStudio />
    </AppShell>
  );
}
