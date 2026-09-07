import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/admin.server";

const NEXT_ID_TOKEN_ENDPOINT = "https://next-id-universe.vercel.app/api/oauth/token";
const NEXT_ID_USERINFO_ENDPOINT = "https://next-id-universe.vercel.app/userinfo";
const ALLOWED_CLIENT_ID = "nextsm-web";
const ALLOWED_REDIRECT_URI = "https://next-servicemanagement.vercel.app/oauth/callback";

export const Route = createFileRoute("/api/oauth/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
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
            body: new URLSearchParams({
              grant_type: "authorization_code",
              client_id: clientId,
              redirect_uri: redirectUri,
              code,
              code_verifier: codeVerifier,
            }),
            cache: "no-store",
          });
          const payload = await upstream.json();
          if (!upstream.ok || !payload.access_token) {
            return Response.json({ ok: false, error: payload?.error || "token_exchange_failed" }, { status: upstream.status || 502 });
          }

          const userinfoResponse = await fetch(NEXT_ID_USERINFO_ENDPOINT, {
            headers: { Authorization: `Bearer ${payload.access_token}` },
            cache: "no-store",
          });
          const userinfo = await userinfoResponse.json();
          if (!userinfoResponse.ok || !userinfo?.sub || !userinfo?.email) {
            return Response.json({ ok: false, error: "invalid_identity" }, { status: 401 });
          }

          const email = String(userinfo.email).trim().toLowerCase();
          const subject = String(userinfo.sub);

          const bySubject = await supabaseAdmin
            .from("profiles")
            .select("id,email,ativo")
            .eq("next_id_subject" as never, subject)
            .maybeSingle();

          let profile = bySubject.data;
          if (bySubject.error && !String(bySubject.error.message).includes("next_id_subject")) {
            return Response.json({ ok: false, error: "identity_lookup_failed" }, { status: 500 });
          }

          if (!profile) {
            const byEmail = await supabaseAdmin
              .from("profiles")
              .select("id,email,ativo")
              .eq("email", email)
              .maybeSingle();
            if (byEmail.error || !byEmail.data) {
              return Response.json({ ok: false, error: "local_user_not_provisioned" }, { status: 403 });
            }
            profile = byEmail.data;

            const { error: mappingError } = await supabaseAdmin
              .from("profiles")
              .update({ next_id_subject: subject } as never)
              .eq("id", profile.id);
            if (mappingError) return Response.json({ ok: false, error: "identity_mapping_failed" }, { status: 500 });
          }

          if (profile.ativo === false) {
            return Response.json({ ok: false, error: "user_inactive" }, { status: 403 });
          }

          const { data: magicLink, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: String(profile.email || email),
          });
          if (magicLinkError || !magicLink?.properties?.action_link) {
            return Response.json({ ok: false, error: "local_session_creation_failed" }, { status: 500 });
          }

          const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
          const cookieBase = "Path=/; HttpOnly; Secure; SameSite=Lax";
          if (payload.access_token) headers.append("Set-Cookie", `nextsm_access_token=${encodeURIComponent(payload.access_token)}; Max-Age=3600; ${cookieBase}`);
          if (payload.refresh_token) headers.append("Set-Cookie", `nextsm_refresh_token=${encodeURIComponent(payload.refresh_token)}; Max-Age=2592000; ${cookieBase}`);

          return new Response(JSON.stringify({
            ok: true,
            redirect_to: magicLink.properties.action_link,
            token_type: payload.token_type,
            expires_in: payload.expires_in,
            scope: payload.scope,
            has_id_token: Boolean(payload.id_token),
          }), { status: 200, headers });
        } catch (error) {
          console.error("[Next ID OAuth] token bridge failed", error);
          return Response.json({ ok: false, error: "oauth_bridge_failed" }, { status: 500 });
        }
      },
    },
  },
});
