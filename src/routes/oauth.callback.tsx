import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const CLIENT_ID = "nextsm-web";
const REDIRECT_URI = "https://next-sm-iuri-dantas.vercel.app/oauth/callback";
const OAUTH_STATE_KEY = "nextsm_oauth_state";
const OAUTH_VERIFIER_KEY = "nextsm_oauth_verifier";

type TokenBridgeResponse = {
  ok?: boolean;
  error?: string;
  redirect_to?: string;
};

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
      const expectedState = localStorage.getItem(OAUTH_STATE_KEY);
      const verifier = localStorage.getItem(OAUTH_VERIFIER_KEY);
      const stateMatches = Boolean(returnedState && expectedState && returnedState === expectedState);

      if (oauthError) {
        setError(`Autorização recusada: ${errorDescription || oauthError}`);
        return;
      }

      if (!code || !returnedState || !expectedState || !stateMatches) {
        const reason = !code
          ? "authorization code não recebido"
          : !returnedState
            ? "state não recebido pelo callback"
            : !expectedState
              ? "state original não encontrado no navegador"
              : "state recebido não corresponde ao state original";

        console.error("[NextSM OAuth] callback inválido", {
          href: window.location.href,
          hasCode: Boolean(code),
          returnedState,
          expectedState,
          returnedStateLength: returnedState?.length ?? 0,
          expectedStateLength: expectedState?.length ?? 0,
          stateMatches,
          hasVerifier: Boolean(verifier),
        });

        setError(`Resposta OAuth inválida: ${reason}.`);
        return;
      }

      if (!verifier) {
        setError("PKCE verifier não encontrado. Inicie o login novamente.");
        return;
      }

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
        setError(payload.error || "Não foi possível concluir a autenticação no NextSM.");
        return;
      }

      localStorage.removeItem(OAUTH_STATE_KEY);
      localStorage.removeItem(OAUTH_VERIFIER_KEY);
      window.location.replace(payload.redirect_to);
    })().catch((cause) => {
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
