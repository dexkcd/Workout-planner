import "server-only";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransport,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { passkeyCredentials, users, type PasskeyCredential, type User } from "@/lib/db/schema";
import { appOrigin, ownerEmail, RP_NAME, rpID } from "./config";

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const buf = Buffer.from(s, "base64url");
  const out = new Uint8Array(new ArrayBuffer(buf.byteLength));
  out.set(buf);
  return out;
}

export async function listCredentials(): Promise<PasskeyCredential[]> {
  return getDb().select().from(passkeyCredentials);
}

export async function hasAnyCredential(): Promise<boolean> {
  const rows = await getDb().select({ id: passkeyCredentials.id }).from(passkeyCredentials).limit(1);
  return rows.length > 0;
}

/**
 * First-time setup: allowed only while no passkey exists, and only for the
 * configured owner email. Creates the single user row if needed.
 */
export async function ensureOwnerUser(email: string): Promise<User | null> {
  const owner = ownerEmail();
  const normalized = email.trim().toLowerCase();
  if (!owner || normalized !== owner) return null;
  const db = getDb();
  const [existing] = await db.select().from(users).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(users).values({ email: normalized, displayName: "Dexter" }).returning();
  return created;
}

export async function registrationOptions(user: User) {
  const existing = await listCredentials();
  return generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpID(),
    userName: user.email,
    userDisplayName: user.displayName,
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.id,
      transports: (c.transports ?? undefined) as AuthenticatorTransport[] | undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
}

export async function verifyRegistration(
  user: User,
  response: RegistrationResponseJSON,
  expectedChallenge: string,
  label: string | null,
): Promise<PasskeyCredential> {
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: appOrigin(),
    expectedRPID: rpID(),
  });
  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Passkey registration could not be verified");
  }
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const [row] = await getDb()
    .insert(passkeyCredentials)
    .values({
      id: credential.id,
      userId: user.id,
      publicKey: toBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? null,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      label,
    })
    .returning();
  return row;
}

export async function authenticationOptions() {
  const existing = await listCredentials();
  return generateAuthenticationOptions({
    rpID: rpID(),
    userVerification: "preferred",
    allowCredentials: existing.map((c) => ({
      id: c.id,
      transports: (c.transports ?? undefined) as AuthenticatorTransport[] | undefined,
    })),
  });
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
): Promise<User> {
  const db = getDb();
  const [cred] = await db.select().from(passkeyCredentials).where(eq(passkeyCredentials.id, response.id)).limit(1);
  if (!cred) throw new Error("Unknown passkey");

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: appOrigin(),
    expectedRPID: rpID(),
    credential: {
      id: cred.id,
      publicKey: fromBase64Url(cred.publicKey),
      counter: cred.counter,
      transports: (cred.transports ?? undefined) as AuthenticatorTransport[] | undefined,
    },
  });
  if (!verification.verified) throw new Error("Passkey could not be verified");

  await db
    .update(passkeyCredentials)
    .set({ counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() })
    .where(eq(passkeyCredentials.id, cred.id));

  const [user] = await db.select().from(users).where(eq(users.id, cred.userId)).limit(1);
  if (!user) throw new Error("Passkey has no user");
  return user;
}
