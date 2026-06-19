import AppShell from "@/components/AppShell";

export const metadata = {
  title: "AI Attorney Matcher | ImmFlow",
  description: "Smart matching for immigration attorney coverage and co-counsel needs.",
};

export default function MatcherRoute() {
  return <AppShell initialPage="matcher" />;
}
