const NEXT_ID_TOKEN_ENDPOINT = "https://next-id-universe.vercel.app/api/oauth/token";
const ALLOWED_CLIENT_ID = "nextsm-web";
const ALLOWED_REDIRECT_URI = "https://next-servicemanagement.vercel.app/oauth/callback";

export const Route = createFileRoute("/api/oauth/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        const clientId = String(body.client_id ?? "");
        const redirectUri = String(body.redirect_uri ?? "");
        const code = String(body.code ?? "");
        const codeVerifier = String(body.code_verifier ?? "");

        if (clientId !== ALLOWED_CLIENT_ID || redirectUri !== ALLOWED_REDIRECT_URI || !code || !codeVerifier) {
          return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
        }

        const upstream = await fetch(NEXT_ID_TOKEN_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, redirect_uri: redirectUri, code, code_verifier: codeVerifier }),
          cache: "no-store",
        });
        const payload = await upstream.json();
        if (!upstream.ok) return Response.json({ ok: false, error: payload?.error || "token_exchange_failed" }, { status: upstream.status });

        const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
        const cookieBase = "Path=/; HttpOnly; Secure; SameSite=Lax";
        if (payload.access_token) headers.append("Set-Cookie", `nextsm_access_token=${encodeURIComponent(payload.access_token)}; Max-Age=3600; ${cookieBase}`);
        if (payload.refresh_token) headers.append("Set-Cookie", `nextsm_refresh_token=${encodeURIComponent(payload.refresh_token)}; Max-Age=2592000; ${cookieBase}`);
        return new Response(JSON.stringify({ ok: true, token_type: payload.token_type, expires_in: payload.expires_in, scope: payload.scope, has_id_token: Boolean(payload.id_token) }), { status: 200, headers });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
