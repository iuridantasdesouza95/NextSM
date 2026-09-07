import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const CLIENT_ID = "nextsm-web";
const REDIRECT_URI = "https://next-sm-iuri-dantas.vercel.app/oauth/callback";

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
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const returnedState = params.get("state");
      const expectedState = sessionStorage.getItem("nextsm_oauth_state");
      const verifier = sessionStorage.getItem("nextsm_oauth_verifier");

      if (params.get("error")) {
        setError(`Autorização recusada: ${params.get("error_description") || params.get("error")}`);
        return;
      }
      if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
        setError("Resposta OAuth inválida: state ou authorization code ausente.");
        return;
      }
      if (!verifier) {
        setError("PKCE verifier não encontrado. Inicie o login novamente.");
        return;
      }

      const response = await fetch("/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, code, code_verifier: verifier }),
      });
      const payload = (await response.json()) as TokenBridgeResponse;
      if (!response.ok || !payload.ok || !payload.redirect_to) {
        setError(payload.error || "Não foi possível concluir a autenticação no NextSM.");
        return;
      }

      sessionStorage.removeItem("nextsm_oauth_state");
      sessionStorage.removeItem("nextsm_oauth_verifier");
      window.location.replace(payload.redirect_to);
    })().catch((cause) => setError(cause instanceof Error ? cause.message : "Falha inesperada no callback OAuth."));
  }, []);

  return <main className="grid min-h-screen place-items-center bg-[#0A1025] px-6 text-white"><div className="max-w-md text-center"><div className="text-lg font-semibold">{error ? "Falha na autenticação" : "Finalizando autenticação…"}</div>{error && <p className="mt-3 text-sm text-red-300">{error}</p>}</div></main>;
}
