import AppShell from "@/components/AppShell";

export const metadata = {
  title: "ImmFlow — Immigration Attorney Network",
  description: "Find hearing coverage, post listings, and connect with U.S. immigration attorneys.",
};

export default function Home() {
  return <AppShell initialPage="home" />;
}
