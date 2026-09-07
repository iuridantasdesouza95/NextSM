import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/admin.server";

const NEXT_ID_TOKEN_ENDPOINT = "https://next-id-universe.vercel.app/oauth/token";
const NEXT_ID_USERINFO_ENDPOINT = "https://next-id-universe.vercel.app/userinfo";
const ALLOWED_CLIENT_ID = "nextsm-web";
const ALLOWED_REDIRECT_URI = "https://next-sm-iuri-dantas.vercel.app/oauth/callback";

function errorResponse(error: string, status: number, stage?: string) {
  console.error("[Next ID OAuth] bridge error", { error, stage });
  return Response.json({ ok: false, error, ...(stage ? { stage } : {}) }, { status });
}

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
            return errorResponse("invalid_request", 400, "request_validation");
          }

          let upstream: Response;
          try {
            upstream = await fetch(NEXT_ID_TOKEN_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, redirect_uri: redirectUri, code, code_verifier: codeVerifier }),
              cache: "no-store",
            });
          } catch (error) {
            console.error("[Next ID OAuth] token endpoint unreachable", error);
            return errorResponse("next_id_unreachable", 502, "token_exchange");
          }

          let payload: Record<string, unknown>;
          try {
            payload = (await upstream.json()) as Record<string, unknown>;
          } catch {
            return errorResponse("next_id_invalid_response", 502, "token_exchange");
          }

          if (!upstream.ok || !payload.access_token) {
            return errorResponse(String(payload.error ?? "token_exchange_failed"), upstream.status >= 400 ? upstream.status : 502, "token_exchange");
          }

          let userinfoResponse: Response;
          try {
            userinfoResponse = await fetch(NEXT_ID_USERINFO_ENDPOINT, {
              headers: { Authorization: `Bearer ${String(payload.access_token)}` },
              cache: "no-store",
            });
          } catch (error) {
            console.error("[Next ID OAuth] userinfo endpoint unreachable", error);
            return errorResponse("next_id_userinfo_unreachable", 502, "userinfo");
          }

          let userinfo: Record<string, unknown>;
          try {
            userinfo = (await userinfoResponse.json()) as Record<string, unknown>;
          } catch {
            return errorResponse("next_id_invalid_userinfo", 502, "userinfo");
          }

          if (!userinfoResponse.ok || !userinfo.sub || !userinfo.email) {
            return errorResponse("invalid_identity", 401, "userinfo");
          }

          const email = String(userinfo.email).trim().toLowerCase();
          const subject = String(userinfo.sub);

          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id,email,ativo,next_id_subject")
            .eq("email", email)
            .maybeSingle();

          if (profileError) {
            console.error("[Next ID OAuth] profile lookup failed", profileError);
            return errorResponse("identity_lookup_failed", 500, "profile_lookup");
          }

          if (!profile) {
            return errorResponse("local_user_not_provisioned", 403, "profile_lookup");
          }

          if (profile.ativo === false) {
            return errorResponse("user_inactive", 403, "profile_lookup");
          }

          if (profile.next_id_subject !== subject) {
            const { error: mappingError } = await supabaseAdmin
              .from("profiles")
              .update({ next_id_subject: subject })
              .eq("id", profile.id);

            if (mappingError) {
              console.error("[Next ID OAuth] identity mapping failed", mappingError);
              return errorResponse("identity_mapping_failed", 500, "profile_mapping");
            }
          }

          const { data: magicLink, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: String(profile.email || email),
          });

          if (magicLinkError || !magicLink?.properties?.action_link) {
            console.error("[Next ID OAuth] local session creation failed", magicLinkError);
            return errorResponse("local_session_creation_failed", 500, "local_session");
          }

          const headers = new Headers({
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          });
          const cookieBase = "Path=/; HttpOnly; Secure; SameSite=Lax";
          headers.append("Set-Cookie", `nextsm_access_token=${encodeURIComponent(String(payload.access_token))}; Max-Age=3600; ${cookieBase}`);
          if (payload.refresh_token) {
            headers.append("Set-Cookie", `nextsm_refresh_token=${encodeURIComponent(String(payload.refresh_token))}; Max-Age=2592000; ${cookieBase}`);
          }

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
          return errorResponse("oauth_bridge_failed", 500, "unexpected");
        }
      },
    },
  },
});
