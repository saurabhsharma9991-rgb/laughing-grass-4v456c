import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Find Immigration Attorneys | ImmFlow",
  description: "Search verified U.S. immigration attorneys by specialty, language, and location.",
};

export default function AttorneysRoute() {
  return <AppShell initialPage="attorneys" />;
}
