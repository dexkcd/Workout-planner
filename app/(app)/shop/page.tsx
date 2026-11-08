import { Placeholder } from "@/components/Placeholder";
import { currentUser } from "@/lib/auth/guard";

export const metadata = { title: "Shop" };

export default async function Page() {
  const user = await currentUser();
  return <Placeholder title="Shop" milestone={7} description="Shopping list from the week's recipes, receipt scanning and meal costs." initial={user?.displayName.charAt(0) ?? "D"} />;
}
