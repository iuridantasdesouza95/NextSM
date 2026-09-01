import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { NextSMLogo } from "@/components/brand/NextSMLogo";

function safeNext(next: unknown): string | null { if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return null; return next; }
const TITULO = "Acesso ao portal — NextSM";
const DESCRICAO = "Entre para abrir e acompanhar chamados de TI e das demais áreas atendidas pela NextSM.";
const URL_PAGINA = "https://next-sm-iuri-dantas.vercel.app/auth";

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
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [nome, setNome] = useState("");
  const [depto, setDepto] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo à NextSM!");
    if (nextPath) { window.location.href = nextPath; return; }
    navigate({ to: "/areas", replace: true });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({ email: regEmail, password: regPass, options: { emailRedirectTo: window.location.origin + "/areas", data: { nome, departamento: depto } } });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique seu e-mail se necessário.");
  }

  return (
    <div className="nextsm-auth min-h-screen overflow-hidden">
      <div className="nextsm-auth__orb nextsm-auth__orb--one" />
      <div className="nextsm-auth__orb nextsm-auth__orb--two" />
      <div className="nextsm-auth__grid" />
      <div className="nextsm-network-bg" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1fr_460px] lg:px-12">
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
          <div className="mb-7 flex justify-center lg:hidden"><NextSMLogo inverse /></div>
          <Card className="nextsm-auth__card border-white/10 bg-white/[0.97] shadow-2xl shadow-black/20">
            <CardHeader className="space-y-3 px-7 pt-7">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0066FF]"><span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF]" /> Acesso seguro</div>
              <CardTitle className="text-2xl tracking-tight text-[#0A1025]">Bem-vindo à NextSM</CardTitle>
              <CardDescription className="text-slate-500">Entre com seu e-mail corporativo para acessar o portal.</CardDescription>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <Tabs defaultValue="login">
                <TabsList className="grid h-11 w-full grid-cols-2 bg-slate-100 p-1">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Criar conta</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <form className="space-y-5 pt-5" onSubmit={handleLogin}>
                    <div className="space-y-2"><Label htmlFor="login-email">E-mail</Label><Input id="login-email" type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="voce@empresa.com" className="h-11 bg-white" /></div>
                    <div className="space-y-2"><Label htmlFor="login-pass">Senha</Label><Input id="login-pass" type="password" required value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="••••••••" className="h-11 bg-white" /></div>
                    <Button type="submit" className="h-11 w-full bg-gradient-to-r from-[#0066FF] to-[#00D4FF] text-white shadow-lg shadow-blue-600/20 hover:brightness-110" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Entrar <ArrowRight className="ml-auto h-4 w-4" /></Button>
                  </form>
                </TabsContent>
                <TabsContent value="register">
                  <form className="space-y-4 pt-5" onSubmit={handleSignup}>
                    <div className="space-y-2"><Label htmlFor="reg-nome">Nome completo</Label><Input id="reg-nome" required value={nome} onChange={e => setNome(e.target.value)} className="h-11 bg-white" /></div>
                    <div className="space-y-2"><Label htmlFor="reg-depto">Departamento</Label><Input id="reg-depto" value={depto} onChange={e => setDepto(e.target.value)} placeholder="Ex.: Comercial" className="h-11 bg-white" /></div>
                    <div className="space-y-2"><Label htmlFor="reg-email">E-mail corporativo</Label><Input id="reg-email" type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className="h-11 bg-white" /></div>
                    <div className="space-y-2"><Label htmlFor="reg-pass">Senha</Label><Input id="reg-pass" type="password" required minLength={6} value={regPass} onChange={e => setRegPass(e.target.value)} className="h-11 bg-white" /></div>
                    <Button type="submit" className="h-11 w-full bg-gradient-to-r from-[#0066FF] to-[#00D4FF] text-white shadow-lg shadow-blue-600/20 hover:brightness-110" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar conta <ArrowRight className="ml-auto h-4 w-4" /></Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <p className="mt-5 text-center text-xs text-slate-400">NextSM • Service Desk</p>
        </div>
      </div>
    </div>
  );
}
