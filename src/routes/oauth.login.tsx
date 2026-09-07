import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const NEXT_ID_AUTHORIZE = "https://next-id-universe.vercel.app/oauth/authorize";
const CLIENT_ID = "nextsm-web";
const REDIRECT_URI = "https://next-sm-iuri-dantas.vercel.app/oauth/callback";

const OAUTH_STATE_KEY = "nextsm_oauth_state";
const OAUTH_VERIFIER_KEY = "nextsm_oauth_verifier";
const OAUTH_NONCE_KEY = "nextsm_oauth_nonce";

function base64url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomString(size = 32) {
  return base64url(crypto.getRandomValues(new Uint8Array(size)));
}

async function sha256Base64url(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64url(new Uint8Array(digest));
}

export const Route = createFileRoute("/oauth/login")({
  ssr: false,
  component: OAuthLogin,
});

function OAuthLogin() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const verifier = randomString(48);
      const state = randomString(32);
      const nonce = randomString(32);
      const challenge = await sha256Base64url(verifier);
      if (cancelled) return;

      // OAuth state belongs to this browser tab. sessionStorage avoids a second
      // login in another tab overwriting the transaction that is in progress.
      sessionStorage.setItem(OAUTH_STATE_KEY, state);
      sessionStorage.setItem(OAUTH_VERIFIER_KEY, verifier);
      sessionStorage.setItem(OAUTH_NONCE_KEY, nonce);

      const url = new URL(NEXT_ID_AUTHORIZE);
      url.searchParams.set("client_id", CLIENT_ID);
      url.searchParams.set("redirect_uri", REDIRECT_URI);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", state);
      url.searchParams.set("nonce", nonce);
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "S256");
      window.location.replace(url.toString());
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#0A1025] px-6 text-white">
      <div className="text-center">
        <div className="text-lg font-semibold">Conectando ao Next ID…</div>
        <p className="mt-2 text-sm text-slate-400">Você será redirecionado para o login central.</p>
      </div>
    </main>
  );
}
