import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Attorney Profile | ImmFlow",
  description: "View verified immigration attorney profile, reviews, and availability.",
};

export default async function AttorneyProfileRoute({ params }) {
  const { id } = await params;
  return <AppShell initialPage="attorneys" attorneyProfileId={id} />;
}
