import { requireUser } from "@/lib/auth/guard";
import { TabBar } from "@/components/nav/TabBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-col gap-3.5 px-5 pt-4 pb-28">{children}</main>
      <TabBar />
    </>
  );
}
