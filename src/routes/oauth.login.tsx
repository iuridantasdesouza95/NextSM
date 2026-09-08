import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const NEXT_ID_AUTHORIZE = "https://next-id-universe.vercel.app/oauth/authorize";
const CLIENT_ID = "nextsm-web";
const REDIRECT_URI = "https://next-servicemanagement.vercel.app/oauth/callback";

const OAUTH_TXN_PREFIX = "nextsm_oauth_txn:";
const OAUTH_COOKIE_PREFIX = "nextsm_oauth_txn_cookie:";
const OAUTH_COOKIE_MAX_AGE = 600;

type OAuthTransaction = {
  verifier: string;
  nonce: string;
  createdAt: number;
};

function base64url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomString(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function sha256Base64url(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64url(new Uint8Array(digest));
}

function setTransactionCookie(state: string, transaction: OAuthTransaction) {
  const value = encodeURIComponent(JSON.stringify(transaction));
  document.cookie = `${OAUTH_COOKIE_PREFIX}${state}=${value}; Max-Age=${OAUTH_COOKIE_MAX_AGE}; Path=/; Secure; SameSite=Lax`;
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

      const transaction: OAuthTransaction = {
        verifier,
        nonce,
        createdAt: Date.now(),
      };

      localStorage.setItem(`${OAUTH_TXN_PREFIX}${state}`, JSON.stringify(transaction));
      setTransactionCookie(state, transaction);

      const url = new URL(NEXT_ID_AUTHORIZE);
      url.searchParams.set("client_id", CLIENT_ID);
      url.searchParams.set("redirect_uri", REDIRECT_URI);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid profile email");
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
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <p>Redirecionando para o Next ID...</p>
    </main>
  );
}
