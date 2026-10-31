import { auth } from "@clerk/nextjs/server";
import { HouseDashboard } from "@/components/site/house-dashboard";

export const metadata = { title: "Your houses" };
export default async function DashboardPage() {
  const session = await auth();
  if (!session.userId)
    return session.redirectToSignIn({ returnBackUrl: "/dashboard" });
  return <HouseDashboard />;
}
