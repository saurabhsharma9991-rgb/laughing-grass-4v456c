import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Dashboard | ImmFlow",
  description: "Manage your ImmFlow profile, listings, messages, and subscription.",
};

export default function DashboardRoute() {
  return <AppShell initialPage="dashboard" />;
}
