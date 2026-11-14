"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const button = {
  padding: "0.8rem 1.4rem",
  fontSize: "0.65rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  border: "1px solid var(--wine-muted)",
  cursor: "pointer",
};

// Signed in: a two-step delete button. Signed out: a link to sign in first.
export default function DeleteAccountClient() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function remove() {
    setBusy(true);
    setError(null);
    // Profile photos live at avatars/<user id>/…; remove them before the account goes.
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (me) {
      const { data: files } = await supabase.storage.from("avatars").list(me);
      if (files?.length) await supabase.storage.from("avatars").remove(files.map(f => `${me}/${f.name}`));
    }
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setError(`Something went wrong: ${error.message}. Please try again or email us.`);
      setBusy(false);
      return;
    }
    await supabase.auth.signOut().catch(() => {});
    setDone(true);
    setBusy(false);
  }

  const text = { fontSize: "0.92rem", lineHeight: 1.75, color: "var(--stone-light)", marginBottom: "0.9rem" };

  if (done) return <p style={{ ...text, color: "#8CB87A" }}>Your account and information have been deleted. Sorry to see you go, and cheers!</p>;
  if (email === undefined) return <p style={text}>Checking whether you&apos;re signed in…</p>;
  if (!email) {
    return (
      <p style={text}>
        <Link href="/login" style={{ color: "var(--gold-light)" }}>Sign in</Link>, then come back to this
        page to delete your account.
      </p>
    );
  }

  return (
    <div style={{ marginBottom: "0.9rem" }}>
      <p style={text}>You&apos;re signed in as <strong>{email}</strong>.</p>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} style={{ ...button, background: "transparent", color: "#E07070" }}>
          Delete my account
        </button>
      ) : (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ ...text, marginBottom: 0, color: "var(--cream)" }}>This can&apos;t be undone. Are you sure?</span>
          <button type="button" onClick={remove} disabled={busy} style={{ ...button, background: "var(--wine)", color: "var(--cream)" }}>
            {busy ? "Deleting…" : "Yes, delete everything"}
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={busy} style={{ ...button, background: "transparent", color: "var(--stone-light)", borderColor: "var(--charcoal-light)" }}>
            Cancel
          </button>
        </div>
      )}
      {error && <p style={{ ...text, color: "#E07070", marginTop: "0.75rem" }}>{error}</p>}
    </div>
  );
}
