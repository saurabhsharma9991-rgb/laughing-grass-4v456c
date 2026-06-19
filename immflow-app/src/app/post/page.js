import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Post a Listing | ImmFlow",
  description: "Post hearing coverage, job, or outsource requests to the immigration attorney network.",
};

export default function PostRoute() {
  return <AppShell initialPage="post" />;
}
