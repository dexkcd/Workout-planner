import { NextResponse } from "next/server";
import { setChallengeCookie } from "@/lib/auth/session";
import { authenticationOptions, hasAnyCredential } from "@/lib/auth/webauthn";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await hasAnyCredential())) {
    return NextResponse.json({ error: "No passkey registered yet" }, { status: 404 });
  }
  const options = await authenticationOptions();
  await setChallengeCookie({ challenge: options.challenge, purpose: "authenticate" });
  return NextResponse.json(options);
}
