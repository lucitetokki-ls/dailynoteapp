import { AppShell } from "@/components/AppShell";
import { SettingsGate } from "@/components/SettingsGate";
import { SettingsPanel } from "@/components/SettingsPanel";

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsGate>
        <SettingsPanel />
      </SettingsGate>
    </AppShell>
  );
}
