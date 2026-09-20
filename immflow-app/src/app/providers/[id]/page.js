import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Provider Profile | ImmFlow",
  description: "View verified immigration service provider profile, credentials, and reviews.",
};

export default async function ProviderProfileRoute({ params }) {
  const { id } = await params;
  return <AppShell initialPage="providerProfile" providerProfileId={id} />;
}
