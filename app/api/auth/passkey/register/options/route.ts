import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth/guard";
import { setChallengeCookie } from "@/lib/auth/session";
import { ensureOwnerUser, hasAnyCredential, registrationOptions } from "@/lib/auth/webauthn";

export const dynamic = "force-dynamic";

const body = z.object({ email: z.string().email().optional() });

/**
 * Registration is allowed for the signed-in user (adding a device), or for
 * first-time setup while no passkey exists and the owner email matches.
 */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  let user = await currentUser();
  if (!user) {
    if (await hasAnyCredential()) {
      return NextResponse.json({ error: "Sign in before adding a passkey" }, { status: 401 });
    }
    if (!parsed.data.email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    user = await ensureOwnerUser(parsed.data.email);
    if (!user) return NextResponse.json({ error: "That email can't set up this app" }, { status: 403 });
  }

  const options = await registrationOptions(user);
  await setChallengeCookie({ challenge: options.challenge, purpose: "register", userId: user.id });
  return NextResponse.json(options);
}
