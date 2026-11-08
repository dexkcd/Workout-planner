import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { setSessionCookie, takeChallengeCookie } from "@/lib/auth/session";
import { verifyRegistration } from "@/lib/auth/webauthn";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const challenge = await takeChallengeCookie("register");
  if (!challenge?.userId) return NextResponse.json({ error: "Registration timed out, try again" }, { status: 400 });

  const [user] = await getDb().select().from(users).where(eq(users.id, challenge.userId)).limit(1);
  if (!user) return NextResponse.json({ error: "Unknown user" }, { status: 400 });

  const payload = (await req.json().catch(() => null)) as { response?: RegistrationResponseJSON; label?: string } | null;
  if (!payload?.response) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    await verifyRegistration(user, payload.response, challenge.challenge, payload.label?.slice(0, 80) ?? null);
  } catch (err) {
    console.error("passkey registration failed", err);
    return NextResponse.json({ error: "Passkey could not be verified" }, { status: 400 });
  }
  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}
