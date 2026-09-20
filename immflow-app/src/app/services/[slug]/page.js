import AppShell from "@/components/AppShell";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `${slug} | ImmFlow Services`,
    description: `Browse verified ${slug} providers on ImmFlow.`,
  };
}

export default async function ServiceCategoryRoute({ params }) {
  const { slug } = await params;
  return <AppShell initialPage="serviceCategory" serviceCategorySlug={slug} />;
}
