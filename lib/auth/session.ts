import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { isProduction } from "./config";

export const SESSION_COOKIE = "fk_session";
export const CHALLENGE_COOKIE = "fk_challenge";
const SESSION_DAYS = 365;
const CHALLENGE_MINUTES = 5;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set and at least 32 characters");
  return new TextEncoder().encode(s);
}

export interface SessionClaims {
  sub: string; // user id
}

export interface ChallengeClaims {
  challenge: string;
  purpose: "register" | "authenticate";
  userId?: string;
}

export async function signSessionToken(userId: string, now = new Date()): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(Math.floor(now.getTime() / 1000))
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload.sub ? { sub: payload.sub } : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifySessionToken(token);
  return claims?.sub ?? null;
}

/** The WebAuthn challenge lives in a short-lived signed cookie; no table needed. */
export async function setChallengeCookie(claims: ChallengeClaims): Promise<void> {
  const token = await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CHALLENGE_MINUTES}m`)
    .sign(secret());
  (await cookies()).set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/api/auth",
    maxAge: CHALLENGE_MINUTES * 60,
  });
}

export async function takeChallengeCookie(purpose: ChallengeClaims["purpose"]): Promise<ChallengeClaims | null> {
  const store = await cookies();
  const token = store.get(CHALLENGE_COOKIE)?.value;
  store.delete({ name: CHALLENGE_COOKIE, path: "/api/auth" });
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.purpose !== purpose || typeof payload.challenge !== "string") return null;
    return {
      challenge: payload.challenge,
      purpose,
      userId: typeof payload.userId === "string" ? payload.userId : undefined,
    };
  } catch {
    return null;
  }
}
