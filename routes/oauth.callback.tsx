import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const CLIENT_ID = "nextsm-web";
const REDIRECT_URI = "https://next-servicemanagement.vercel.app/oauth/callback";
const OAUTH_TXN_PREFIX = "nextsm_oauth_txn:";
const OAUTH_PROCESSING_PREFIX = "nextsm_oauth_processing:";
const OAUTH_TRANSACTION_MAX_AGE_MS = 10 * 60 * 1000;

type OAuthTransaction = {
  verifier?: string;
  nonce?: string;
  createdAt?: number;
};

type TokenBridgeResponse = {
  ok?: boolean;
  error?: string;
  redirect_to?: string;
};

function transactionKey(state: string) {
  return `${OAUTH_TXN_PREFIX}${state}`;
}

function processingKey(state: string) {
  return `${OAUTH_PROCESSING_PREFIX}${state}`;
}

function readTransaction(state: string): OAuthTransaction | null {
  try {
    const raw = localStorage.getItem(transactionKey(state));
    if (!raw) return null;
    const transaction = JSON.parse(raw) as OAuthTransaction;
    if (!transaction.verifier || !transaction.createdAt) return null;
    if (Date.now() - transaction.createdAt > OAUTH_TRANSACTION_MAX_AGE_MS) return null;
    return transaction;
  } catch {
    return null;
  }
}

function clearTransaction(state: string) {
  localStorage.removeItem(transactionKey(state));
  localStorage.removeItem(processingKey(state));
}

export const Route = createFileRoute("/oauth/callback")({
  ssr: false,
  component: OAuthCallback,
});

function OAuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const getParam = (name: string) => query.get(name) ?? hash.get(name);

      const code = getParam("code");
      const returnedState = getParam("state");
      const oauthError = getParam("error");
      const errorDescription = getParam("error_description");

      if (oauthError) {
        if (returnedState) clearTransaction(returnedState);
        setError(`Autorização recusada: ${errorDescription || oauthError}`);
        return;
      }

      if (!code || !returnedState) {
        console.error("[NextSM OAuth] callback inválido", {
          hasCode: Boolean(code),
          hasReturnedState: Boolean(returnedState),
        });
        setError(`Resposta OAuth inválida: ${!code ? "authorization code não recebido" : "state não recebido pelo callback"}.`);
        return;
      }

      const transaction = readTransaction(returnedState);
      const verifier = transaction?.verifier;
      const hasTransaction = Boolean(transaction);
      const stateKey = processingKey(returnedState);

      if (!transaction || !verifier) {
        console.error("[NextSM OAuth] callback inválido", {
          hasCode: true,
          hasReturnedState: true,
          hasTransaction,
          hasVerifier: Boolean(verifier),
        });
        setError("Resposta OAuth inválida: transação PKCE não encontrada nesta sessão. Inicie o login novamente.");
        return;
      }

      if (localStorage.getItem(stateKey) === "1") return;
      localStorage.setItem(stateKey, "1");

      if (cancelled) return;

      const response = await fetch("/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          code,
          code_verifier: verifier,
        }),
      });

      const payload = (await response.json()) as TokenBridgeResponse;
      if (!response.ok || !payload.ok || !payload.redirect_to) {
        clearTransaction(returnedState);
        setError(payload.error || "Não foi possível concluir a autenticação no NextSM.");
        return;
      }

      clearTransaction(returnedState);
      window.location.replace(payload.redirect_to);
    })().catch((cause) => {
      const state = new URLSearchParams(window.location.search).get("state");
      if (state) clearTransaction(state);
      setError(cause instanceof Error ? cause.message : "Falha inesperada no callback OAuth.");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#0A1025] px-6 text-white">
      <div className="max-w-md text-center">
        <div className="text-lg font-semibold">
          {error ? "Falha na autenticação" : "Finalizando autenticação…"}
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>
    </main>
  );
}
