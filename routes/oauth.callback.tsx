import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const CLIENT_ID = "nextsm-web";
const REDIRECT_URI = "https://next-servicemanagement.vercel.app/oauth/callback";
const OAUTH_TXN_PREFIX = "nextsm_oauth_txn:";

export const Route = createFileRoute("/oauth/callback")({
  ssr: false,
  component: OAuthCallback,
});

function OAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      window.location.replace(`/auth?oauth_error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    if (!code || !state) {
      window.location.replace("/auth?oauth_error=callback_invalid");
      return;
    }

    const key = `${OAUTH_TXN_PREFIX}${state}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      window.location.replace("/auth?oauth_error=oauth_transaction_not_found");
      return;
    }

    let transaction: { verifier: string; nonce: string; createdAt: number };
    try {
      transaction = JSON.parse(raw);
    } catch {
      localStorage.removeItem(key);
      window.location.replace("/auth?oauth_error=oauth_transaction_invalid");
      return;
    }

    localStorage.removeItem(key);

    void (async () => {
      try {
        const response = await fetch("/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "authorization_code",
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            code,
            code_verifier: transaction.verifier,
            nonce: transaction.nonce,
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.redirect_to) {
          console.error("[NextSM OAuth] token exchange failed", payload);
          window.location.replace(`/auth?oauth_error=${encodeURIComponent(payload?.error || "oauth_bridge_failed")}`);
          return;
        }

        window.location.replace(payload.redirect_to);
      } catch (exchangeError) {
        console.error("[NextSM OAuth] token exchange exception", exchangeError);
        window.location.replace("/auth?oauth_error=oauth_bridge_failed");
      }
    })();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#0A1025] px-6 text-white">
      <div className="text-center">
        <div className="text-lg font-semibold">Finalizando seu acesso…</div>
        <p className="mt-2 text-sm text-slate-400">Aguarde enquanto concluímos a autenticação.</p>
      </div>
    </main>
  );
}
