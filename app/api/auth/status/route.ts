import { NextResponse } from "next/server";
import { ownerEmail } from "@/lib/auth/config";
import { hasAnyCredential } from "@/lib/auth/webauthn";

export const dynamic = "force-dynamic";

/** Tells the login page whether this is first-time setup. */
export async function GET() {
  const hasCredentials = await hasAnyCredential();
  return NextResponse.json({ hasCredentials, setupPossible: !hasCredentials && ownerEmail() !== null });
}
