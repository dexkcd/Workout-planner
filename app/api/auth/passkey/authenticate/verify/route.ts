import { NextResponse } from "next/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { setSessionCookie, takeChallengeCookie } from "@/lib/auth/session";
import { verifyAuthentication } from "@/lib/auth/webauthn";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const challenge = await takeChallengeCookie("authenticate");
  if (!challenge) return NextResponse.json({ error: "Sign-in timed out, try again" }, { status: 400 });

  const payload = (await req.json().catch(() => null)) as { response?: AuthenticationResponseJSON } | null;
  if (!payload?.response) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    const user = await verifyAuthentication(payload.response, challenge.challenge);
    await setSessionCookie(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("passkey authentication failed", err);
    return NextResponse.json({ error: "Passkey could not be verified" }, { status: 401 });
  }
}
