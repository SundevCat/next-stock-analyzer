import { AppShellClient } from "@/components/AppShellClient";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AppShellClient>{children}</AppShellClient>;
}
