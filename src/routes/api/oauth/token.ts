import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/admin.server";

const NEXT_ID_TOKEN_ENDPOINT = "https://next-id-universe.vercel.app/oauth/token";
const NEXT_ID_USERINFO_ENDPOINT = "https://next-id-universe.vercel.app/userinfo";
const ALLOWED_CLIENT_ID = "nextsm-web";
const ALLOWED_REDIRECT_URI = "https://next-servicemanagement.vercel.app/oauth/callback";

function errorResponse(error: string, status: number, stage?: string) {
  console.error("[Next ID OAuth] bridge error", { error, stage });
  return Response.json({ ok: false, error, ...(stage ? { stage } : {}) }, { status });
}

async function createLocalSession(email: string, data?: Record<string, unknown>) {
  const generated = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    ...(data ? { options: { data } } : {}),
  });

  if (generated.error || !generated.data?.properties?.action_link) {
    return { error: generated.error ?? new Error("magic link was not generated") };
  }

  // Consume the one-time link on the server. The browser never follows the
  // Supabase action-link redirect, so there is no second auth redirect/race.
  const actionUrl = new URL(generated.data.properties.action_link);
  const tokenHash = actionUrl.searchParams.get("token") ?? actionUrl.searchParams.get("token_hash");

  if (!tokenHash) {
    return { error: new Error("generated magic link did not contain a token") };
  }

  const verified = await supabaseAdmin.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (verified.error || !verified.data.session) {
    return { error: verified.error ?? new Error("local session was not created") };
  }

  return {
    session: verified.data.session,
    user: generated.data.user,
  };
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
              body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: clientId,
                redirect_uri: redirectUri,
                code,
                code_verifier: codeVerifier,
              }),
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
          const displayName = String(userinfo.name ?? userinfo.full_name ?? email).trim() || email;

          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id,email,ativo,next_id_subject")
            .eq("email", email)
            .maybeSingle();

          if (profileError) {
            console.error("[Next ID OAuth] profile lookup failed", profileError);
            return errorResponse("identity_lookup_failed", 500, "profile_lookup");
          }

          let localProfile = profile;
          let session;

          if (!localProfile) {
            // Next ID has already authenticated and authorized the identity.
            // We only provision the corresponding NextSM local user/session.
            const localSession = await createLocalSession(email, { nome: displayName });

            if (localSession.error || !localSession.session || !localSession.user?.id) {
              console.error("[Next ID OAuth] local auth provisioning failed", localSession.error);
              return errorResponse("local_user_provisioning_failed", 500, "local_provisioning");
            }

            session = localSession.session;

            const { data: provisionedProfile, error: provisionError } = await supabaseAdmin
              .from("profiles")
              .upsert(
                {
                  id: localSession.user.id,
                  nome: displayName,
                  email,
                  ativo: true,
                  next_id_subject: subject,
                },
                { onConflict: "id" },
              )
              .select("id,email,ativo,next_id_subject")
              .single();

            if (provisionError || !provisionedProfile) {
              console.error("[Next ID OAuth] local profile provisioning failed", provisionError);
              return errorResponse("local_profile_provisioning_failed", 500, "local_provisioning");
            }

            localProfile = provisionedProfile;
          } else {
            if (localProfile.ativo === false) {
              return errorResponse("user_inactive", 403, "profile_lookup");
            }

            if (localProfile.next_id_subject !== subject) {
              const { error: mappingError } = await supabaseAdmin
                .from("profiles")
                .update({ next_id_subject: subject } as never)
                .eq("id", localProfile.id);

              if (mappingError) {
                console.error("[Next ID OAuth] identity mapping failed", mappingError);
                return errorResponse("identity_mapping_failed", 500, "profile_mapping");
              }
            }

            const localSession = await createLocalSession(String(localProfile.email || email));
            if (localSession.error || !localSession.session) {
              console.error("[Next ID OAuth] local session creation failed", localSession.error);
              return errorResponse("local_session_creation_failed", 500, "local_session");
            }

            session = localSession.session;
          }

          if (localProfile.ativo === false) {
            return errorResponse("user_inactive", 403, "profile_lookup");
          }

          return Response.json(
            {
              ok: true,
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_in: session.expires_in,
              expires_at: session.expires_at,
              token_type: session.token_type,
              user_id: session.user.id,
              has_id_token: Boolean(payload.id_token),
            },
            {
              status: 200,
              headers: { "Cache-Control": "no-store" },
            },
          );
        } catch (error) {
          console.error("[Next ID OAuth] token bridge failed", error);
          return errorResponse("oauth_bridge_failed", 500, "unexpected");
        }
      },
    },
  },
});
