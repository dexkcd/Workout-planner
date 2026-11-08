import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/guard";
import { LoginPasskey } from "@/components/auth/PasskeyButtons";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentUser()) redirect("/today");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col gap-2">
        <span className="flex size-12 items-center justify-center rounded-[14px] bg-primary text-[22px] font-bold text-primary-foreground">
          F
        </span>
        <h1 className="m-0 text-[30px] font-bold tracking-[-0.01em]">Formkoll</h1>
        <p className="m-0 text-[15px] text-dim">Your winter training and diet plan, day by day.</p>
      </div>
      <section className="flex flex-col gap-4 rounded-[20px] bg-surface p-[18px]">
        <LoginPasskey />
      </section>
    </main>
  );
}
