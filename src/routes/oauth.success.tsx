import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/oauth/success")({
  ssr: false,
  component: OAuthSuccess,
});

function OAuthSuccess() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0A1025] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl">
        <CheckCircle2 className="mx-auto h-14 w-14 text-cyan-300" />
        <h1 className="mt-5 text-2xl font-semibold">Next ID conectado</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">O fluxo OAuth Authorization Code + PKCE foi concluído e o NextSM recebeu os tokens com segurança no servidor.</p>
        <Link to="/auth"><Button className="mt-6">Voltar ao login</Button></Link>
      </div>
    </main>
  );
}
