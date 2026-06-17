import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Immigration Job Board | ImmFlow",
  description: "Browse immigration attorney job listings, hearing coverage, and outsource opportunities.",
};

export default function JobsRoute() {
  return <AppShell initialPage="jobs" />;
}
