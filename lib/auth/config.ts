export const RP_NAME = "Formkoll";

export function rpID(): string {
  return process.env.WEBAUTHN_RP_ID || "localhost";
}

export function appOrigin(): string {
  const url = process.env.APP_URL || "http://localhost:3000";
  return new URL(url).origin;
}

export function ownerEmail(): string | null {
  const v = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return v ? v : null;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
