import { Placeholder } from "@/components/Placeholder";
import { currentUser } from "@/lib/auth/guard";

export const metadata = { title: "Food" };

export default async function Page() {
  const user = await currentUser();
  return <Placeholder title="Food" milestone={5} description="Daily log by slot, meal templates, recipes, food search and barcode scan." initial={user?.displayName.charAt(0) ?? "D"} />;
}
