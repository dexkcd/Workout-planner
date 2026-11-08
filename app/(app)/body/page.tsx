import { Placeholder } from "@/components/Placeholder";
import { currentUser } from "@/lib/auth/guard";

export const metadata = { title: "Body" };

export default async function Page() {
  const user = await currentUser();
  return <Placeholder title="Body" milestone={3} description="Weigh-ins, waist, weekly check-in, weekly average against the projection and adjustment suggestions." initial={user?.displayName.charAt(0) ?? "D"} />;
}
