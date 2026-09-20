import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Services | ImmFlow",
  description:
    "Find immigration attorneys, certified translators, interpreters, and psychological evaluation professionals.",
};

export default function ServicesRoute() {
  return <AppShell initialPage="services" />;
}
