import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Ticket, ShieldCheck, Zap, BookOpen, ArrowRight, Bot, BarChart3, CheckCircle2, Network, Sparkles } from "lucide-react";
import { serializarJsonLd } from "@/lib/json-ld";
import { NextSMLogo } from "@/components/brand/NextSMLogo";

const TITULO = "NextSM — Service Management";
const DESCRICAO = "Service Management inteligente para chamados, SLA, conhecimento, ITSM e automação em uma única plataforma.";
const URL_PAGINA = "https://next-sm-iuri-dantas.vercel.app/";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL_PAGINA },
    ],
    links: [{ rel: "canonical", href: URL_PAGINA }],
    scripts: [{ type: "application/ld+json", children: serializarJsonLd({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: TITULO, url: URL_PAGINA, description: DESCRICAO, applicationCategory: "BusinessApplication", inLanguage: "pt-BR" }) }],
  }),
  component: Landing,
});

const features = [
  { icon: Ticket, title: "Gestão de chamados", desc: "Centralize solicitações, prioridades, responsáveis e todo o histórico do atendimento." },
  { icon: BarChart3, title: "SLA e indicadores", desc: "Acompanhe prazos, desempenho e indicadores para transformar atendimento em gestão." },
  { icon: BookOpen, title: "Conhecimento", desc: "Concentre procedimentos e respostas em uma base acessível para usuários e equipes." },
  { icon: Network, title: "ITSM integrado", desc: "Problemas, mudanças, ativos, serviços, relacionamentos, governança e auditoria." },
  { icon: Bot, title: "IA e automação", desc: "Use inteligência para acelerar respostas, orientar usuários e reduzir tarefas repetitivas." },
  { icon: ShieldCheck, title: "Governança", desc: "Permissões, rastreabilidade e controles para uma operação segura e organizada." },
];

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A1025]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center" aria-label="NextSM início">
            <NextSMLogo inverse className="scale-[0.68] origin-left" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-300 sm:block">Service Management Platform</span>
            <Link to="/auth"><Button className="rounded-lg bg-white text-[#0A1025] shadow-none hover:bg-blue-50">Entrar <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate bg-[#0A1025] text-white">
          <div className="nextsm-network-bg" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden="true">
            <div className="absolute -right-32 -top-32 h-[34rem] w-[34rem] rounded-full border border-cyan-400/20" />
            <div className="absolute -right-20 -top-20 h-[28rem] w-[28rem] rounded-full border border-blue-400/10" />
            <div className="absolute right-[16%] top-[22%] h-2 w-2 rounded-full bg-[#00D4FF] shadow-[0_0_22px_#00D4FF]" />
            <div className="absolute right-[29%] top-[42%] h-1.5 w-1.5 rounded-full bg-[#0066FF]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
          </div>
          <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
            <div>
              <NextSMLogo inverse className="mb-9" />
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-200"><Sparkles className="h-3.5 w-3.5" /> Service Management inteligente</div>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">Conecte serviços.<br /><span className="text-[#00D4FF]">Evolua sua operação.</span></h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">A NextSM conecta pessoas, sistemas e processos em uma plataforma moderna para gestão de serviços, atendimento, conhecimento, ITSM e automação.</p>
              <div className="mt-9 flex flex-wrap gap-3"><Link to="/auth"><Button size="lg" className="h-12 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#00D4FF] px-6 text-white shadow-lg shadow-blue-950/30 hover:brightness-110">Acessar a plataforma <ArrowRight className="ml-2 h-4 w-4" /></Button></Link><a href="#recursos" className="inline-flex h-12 items-center rounded-lg border border-white/15 px-6 text-sm font-medium text-white hover:bg-white/5">Conhecer recursos</a></div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs text-slate-400"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#00D4FF]" /> Atendimento centralizado</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#00D4FF]" /> ITSM integrado</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#00D4FF]" /> Inteligência e automação</span></div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-10 rounded-full border border-cyan-400/10" /><div className="absolute -inset-20 rounded-full border border-blue-400/5" />
              <div className="relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="mb-5 flex items-center justify-between"><div><div className="text-xs text-slate-400">Visão operacional</div><div className="mt-1 text-lg font-semibold">Central de Serviços</div></div><div className="rounded-lg bg-blue-500/15 p-2 text-cyan-300"><BarChart3 className="h-5 w-5" /></div></div>
                <div className="grid grid-cols-3 gap-3">{[["Chamados","128","12%"],["Em atendimento","42","8%"],["SLA","96,4%","4%"]].map(([label,value,change]) => <div key={label} className="rounded-xl border border-white/10 bg-black/10 p-4"><div className="text-[11px] text-slate-400">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div><div className="mt-1 text-[10px] text-cyan-300">↑ {change}</div></div>)}</div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-4"><div className="mb-4 flex justify-between text-xs"><span className="text-slate-300">Fluxo de atendimento</span><span className="text-cyan-300">Últimos 30 dias</span></div><div className="flex h-28 items-end gap-2">{[35,52,44,68,58,82,72,92,76,98,84,100].map((height,index)=><div key={index} className="flex-1 rounded-t bg-gradient-to-t from-[#0066FF] to-[#00D4FF]" style={{height:`${height}%`}} />)}</div></div>
                <div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-black/10 p-3"><div className="text-[10px] text-slate-400">Conhecimento</div><div className="mt-1 text-sm font-medium">Base inteligente</div></div><div className="rounded-xl border border-white/10 bg-black/10 p-3"><div className="text-[10px] text-slate-400">Automação</div><div className="mt-1 text-sm font-medium">IA Assistente</div></div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className="bg-[#F8FAFC] px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0066FF]">Uma plataforma completa</div><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0A1025] sm:text-4xl">Tudo conectado em um único Service Management</h2><p className="mt-4 text-base leading-7 text-[#64748B]">Do primeiro chamado à gestão estratégica, a NextSM organiza o fluxo de serviços com uma experiência simples para usuários e poderosa para equipes.</p></div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map(({icon:Icon,title,desc})=><div key={title} className="group rounded-2xl border border-slate-200 bg-white p-7 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/50"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-[#0066FF]"><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-lg font-semibold text-[#0A1025]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#64748B]">{desc}</p></div>)}</div>
          </div>
        </section>

        <section className="bg-white px-6 py-24 lg:px-8"><div className="mx-auto max-w-7xl rounded-3xl bg-[#0A1025] px-7 py-14 text-center text-white sm:px-12"><div className="mx-auto flex h-14 w-14 items-center justify-center"><NextSMLogo compact inverse /></div><h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">A próxima evolução da gestão de serviços começa aqui.</h2><p className="mx-auto mt-4 max-w-xl text-slate-300">Centralize, automatize e evolua sua operação com a NextSM.</p><Link to="/auth"><Button size="lg" className="mt-8 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#00D4FF] text-white hover:brightness-110">Entrar na NextSM <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div></section>
      </main>

      <footer className="border-t border-slate-200 bg-[#F8FAFC] px-6 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row"><div className="flex items-center gap-3 font-semibold text-[#0A1025]"><NextSMLogo className="scale-[0.38] origin-left -mr-20" /></div><span>NextSM · Service Desk · © {new Date().getFullYear()}</span></div></footer>
    </div>
  );
}
