"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { KeyIcon } from "@/components/icons";

type Status = { hasCredentials: boolean; setupPossible: boolean };

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

function deviceLabel(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android phone";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  return "Browser";
}

export function LoginPasskey() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setError("Could not reach the server"));
  }, []);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const options = await postJson<Parameters<typeof startAuthentication>[0]["optionsJSON"]>(
        "/api/auth/passkey/authenticate/options",
      );
      const response = await startAuthentication({ optionsJSON: options });
      await postJson("/api/auth/passkey/authenticate/verify", { response });
      router.replace("/today");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function setUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const options = await postJson<Parameters<typeof startRegistration>[0]["optionsJSON"]>(
        "/api/auth/passkey/register/options",
        { email },
      );
      const response = await startRegistration({ optionsJSON: options });
      await postJson("/api/auth/passkey/register/verify", { response, label: deviceLabel() });
      router.replace("/today");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  }

  if (!status) {
    return <p className="m-0 text-[14px] text-dim">Checking…</p>;
  }

  if (status.hasCredentials) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={signIn}
          disabled={busy}
          className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
        >
          <KeyIcon size={20} />
          {busy ? "Waiting for your passkey…" : "Sign in with passkey"}
        </button>
        {error ? <p className="m-0 text-[13px] text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (!status.setupPossible) {
    return (
      <p className="m-0 text-[14px] text-dim">
        No passkey is registered yet, and the server has no owner email configured. Set <code>OWNER_EMAIL</code> and try again.
      </p>
    );
  }

  return (
    <form onSubmit={setUp} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-[13px] text-dim">
        Your email
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-[12px] border border-border bg-surface-2 px-3.5 text-[16px] text-foreground outline-none focus:border-primary"
        />
      </label>
      <button
        type="submit"
        disabled={busy || !email}
        className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
      >
        <KeyIcon size={20} />
        {busy ? "Waiting for your passkey…" : "Set up passkey"}
      </button>
      <p className="m-0 text-[12px] text-dim">
        First-time setup. Only the owner email configured on the server can create the passkey.
      </p>
      {error ? <p className="m-0 text-[13px] text-destructive">{error}</p> : null}
    </form>
  );
}

/** For Settings: registers an extra passkey on the current device while signed in. */
export function AddPasskeyButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setMessage(null);
    try {
      const options = await postJson<Parameters<typeof startRegistration>[0]["optionsJSON"]>(
        "/api/auth/passkey/register/options",
      );
      const response = await startRegistration({ optionsJSON: options });
      await postJson("/api/auth/passkey/register/verify", { response, label: deviceLabel() });
      setMessage("Passkey added.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not add the passkey");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={add}
        disabled={busy}
        className="flex h-11 items-center justify-center gap-2 rounded-[12px] border border-border bg-transparent px-4 text-[14px] font-medium disabled:opacity-60"
      >
        <KeyIcon size={18} />
        {busy ? "Waiting for your passkey…" : "Add a passkey on this device"}
      </button>
      {message ? <p className="m-0 text-[13px] text-dim">{message}</p> : null}
    </div>
  );
}
