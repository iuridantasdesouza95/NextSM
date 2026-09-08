import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const OAUTH_TXN_PREFIX = "nextsm_oauth_txn:";
const OAUTH_COOKIE_PREFIX = "nextsm_oauth_txn_cookie:";

type OAuthTransaction = {
  verifier: string;
  nonce: string;
  createdAt: number;
};

function getTransactionCookie(state: string) {
  const name = `${OAUTH_COOKIE_PREFIX}${state}=`;
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(name));
  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(name.length));
  } catch {
    return null;
  }
}

function removeTransactionCookie(state: string) {
  document.cookie = `${OAUTH_COOKIE_PREFIX}${state}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
}

export const Route = createFileRoute("/oauth/callback")({
  ssr: false,
  component: OAuthCallback,
});

function OAuthCallback() {
  useEffect(() => {
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const oauthError = params.get("error");

      if (oauthError) {
        window.location.replace(`/auth?oauth_error=${encodeURIComponent(oauthError)}`);
        return;
      }

      if (!code || !state) {
        window.location.replace("/auth?oauth_error=oauth_callback_invalid");
        return;
      }

      const key = `${OAUTH_TXN_PREFIX}${state}`;
      const raw = localStorage.getItem(key) ?? getTransactionCookie(state);

      if (!raw) {
        window.location.replace("/auth?oauth_error=oauth_transaction_not_found");
        return;
      }

      let transaction: OAuthTransaction;
      try {
        transaction = JSON.parse(raw) as OAuthTransaction;
      } catch {
        localStorage.removeItem(key);
        removeTransactionCookie(state);
        window.location.replace("/auth?oauth_error=oauth_transaction_invalid");
        return;
      }

      localStorage.removeItem(key);
      removeTransactionCookie(state);

      try {
        const response = await fetch("/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            state,
            verifier: transaction.verifier,
            nonce: transaction.nonce,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { redirect_to?: string; error?: string }
          | null;

        if (!response.ok || !payload?.redirect_to) {
          const error = payload?.error ?? "oauth_token_exchange_failed";
          window.location.replace(`/auth?oauth_error=${encodeURIComponent(error)}`);
          return;
        }

        window.location.replace(payload.redirect_to);
      } catch {
        window.location.replace("/auth?oauth_error=oauth_token_exchange_failed");
      }
    })();
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <p>Finalizando autenticação...</p>
    </main>
  );
}
