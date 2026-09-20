import AppShell from "@/components/AppShell";

export const metadata = {
  title: "ImmFlow — Immigration Services Marketplace",
  description:
    "Find verified immigration attorneys, certified translators, interpreters, and psychological evaluation professionals.",
};

export default function Home() {
  return <AppShell initialPage="home" />;
}
