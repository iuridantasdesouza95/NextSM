import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRight, ShieldCheck, Zap, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { NextSMLogo } from "@/components/brand/NextSMLogo";

function safeNext(next: unknown): string | null { if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return null; return next; }
const TITULO = "Acesso ao portal — NextSM";
const DESCRICAO = "Entre para abrir e acompanhar chamados de TI e das demais áreas atendidas pela NextSM.";
const URL_PAGINA = "https://next-servicemanagement.vercel.app/auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: TITULO }, { name: "description", content: DESCRICAO }, { property: "og:title", content: TITULO }, { property: "og:description", content: DESCRICAO }, { property: "og:type", content: "website" }, { property: "og:url", content: URL_PAGINA }, { name: "twitter:card", content: "summary" }, { name: "twitter:title", content: TITULO }, { name: "twitter:description", content: DESCRICAO }, { name: "robots", content: "noindex, follow" }], links: [{ rel: "canonical", href: URL_PAGINA }] }),
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({ next: safeNext(s.next) ?? undefined }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const next = safeNext(search.next);
      if (next && next !== "/dashboard") throw redirect({ href: next });
      throw redirect({ to: "/areas" });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const nextPath = safeNext(next) && next !== "/dashboard" ? safeNext(next) : null;
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const email = String(form.get("login-email") ?? "");
    const password = String(form.get("login-pass") ?? "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo à NextSM!");
    if (nextPath) { window.location.href = nextPath; return; }
    navigate({ to: "/areas", replace: true });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const nome = String(form.get("reg-nome") ?? "");
    const depto = String(form.get("reg-depto") ?? "");
    const email = String(form.get("reg-email") ?? "");
    const password = String(form.get("reg-pass") ?? "");
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/areas", data: { nome, departamento: depto } } });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique seu e-mail se necessário.");
  }

  function handleNextIdLogin() {
    window.location.assign(`/oauth/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  }

  const loginButtonClass = "h-11 w-full !bg-gradient-to-r !from-[#0066FF] !to-[#00D4FF] !text-white shadow-lg shadow-blue-600/20 hover:brightness-110";

  return (
    <div className="nextsm-auth min-h-screen overflow-x-hidden overflow-y-auto">
      <div className="nextsm-auth__orb nextsm-auth__orb--one" />
      <div className="nextsm-auth__orb nextsm-auth__orb--two" />
      <div className="nextsm-auth__grid" />
      <div className="nextsm-network-bg" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-start gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:items-center lg:gap-12 lg:grid-cols-[1fr_460px] lg:px-12">
        <section className="hidden lg:block">
          <NextSMLogo inverse className="mb-10" />
          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Service Desk</p>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-white xl:text-6xl">Estrutura inteligente para uma operação que não para.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">Centralize atendimento, processos, conhecimento e automação em uma experiência de Service Management moderna.</p>
          </div>
          <div className="mt-10 flex gap-3">
            <div className="nextsm-auth__feature"><Zap className="h-4 w-4 text-cyan-300" /><span>Automação</span></div>
            <div className="nextsm-auth__feature"><ShieldCheck className="h-4 w-4 text-cyan-300" /><span>Governança</span></div>
            <div className="nextsm-auth__feature"><ArrowRight className="h-4 w-4 text-cyan-300" /><span>Evolução</span></div>
          </div>
        </section>

        <div className="w-full max-w-md justify-self-center lg:max-w-[460px]">
          <div className="mb-6 flex justify-center lg:hidden"><NextSMLogo inverse /></div>
          <Card className="nextsm-auth__card border-white/10 bg-white/[0.97] shadow-2xl shadow-black/20">
            <CardHeader className="space-y-3 px-5 pt-6 sm:px-7 sm:pt-7">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0066FF]"><span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF]" /> Acesso seguro</div>
              <CardTitle className="text-2xl tracking-tight text-[#0A1025]">Bem-vindo à NextSM</CardTitle>
              <CardDescription className="text-slate-500">Escolha como deseja acessar o portal.</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-6 sm:px-7 sm:pb-7">
              <Button type="button" onClick={handleNextIdLogin} className={loginButtonClass} disabled={loading}>
                <KeyRound className="mr-2 h-4 w-4" />
                Entrar com Next ID
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><div className="h-px flex-1 bg-slate-200" /><span>ou entre com sua conta NextSM</span><div className="h-px flex-1 bg-slate-200" /></div>
              <Tabs defaultValue="login">
                <TabsList className="grid h-11 w-full grid-cols-2 bg-slate-100 p-1">
                  <TabsTrigger value="login">E-mail e senha</TabsTrigger>
                  <TabsTrigger value="register">Criar conta</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <form className="space-y-5 pt-5" onSubmit={handleLogin}>
                    <div className="space-y-2"><Label htmlFor="login-email">E-mail</Label><Input id="login-email" name="login-email" type="email" required placeholder="voce@empresa.com" className="h-11 bg-white" /></div>
                    <div className="space-y-2"><Label htmlFor="login-pass">Senha</Label><Input id="login-pass" name="login-pass" type="password" required placeholder="••••••••" className="h-11 bg-white" /></div>
                    <Button type="submit" className={loginButtonClass} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Entrar <ArrowRight className="ml-auto h-4 w-4" /></Button>
                  </form>
                </TabsContent>
                <TabsContent value="register">
                  <form className="space-y-4 pt-5" onSubmit={handleSignup}>
                    <div className="space-y-2"><Label htmlFor="reg-nome">Nome completo</Label><Input id="reg-nome" name="reg-nome" required /></div>
                    <div className="space-y-2"><Label htmlFor="reg-depto">Departamento</Label><Input id="reg-depto" name="reg-depto" placeholder="Ex.: Comercial" /></div>
                    <div className="space-y-2"><Label htmlFor="reg-email">E-mail corporativo</Label><Input id="reg-email" name="reg-email" type="email" required /></div>
                    <div className="space-y-2"><Label htmlFor="reg-pass">Senha</Label><Input id="reg-pass" name="reg-pass" type="password" required minLength={6} /></div>
                    <Button type="submit" className={loginButtonClass} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar conta <ArrowRight className="ml-auto h-4 w-4" /></Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <p className="mt-5 pb-2 text-center text-xs text-slate-400">NextSM • Service Desk</p>
        </div>
      </div>
    </div>
  );
}
