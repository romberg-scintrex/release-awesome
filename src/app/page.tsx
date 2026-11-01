import type { Metadata } from "next";
import { PlatformHome } from "@/components/Layouts/PlatformHome";
import { getApprovedProfiles } from "@/lib/queries-by-user";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 60;

export default async function Home() {
  // The only read this page makes, and it degrades to [] - the homepage has no
  // other dependency on the database and must render without one.
  const showcase = await getApprovedProfiles(6);

  // No JSON-LD here: the root layout emits the WebSite block, and a second one
  // with the same @id would be duplicate structured data.
  return <PlatformHome showcase={showcase} />;
}
