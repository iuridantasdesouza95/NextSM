import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Ticket, ShieldCheck, Zap, BookOpen } from "lucide-react";
import { serializarJsonLd } from "@/lib/json-ld";

const TITULO = "NextSM — Service Desk";
const DESCRICAO = "Central de atendimento e gestão de chamados da NextSM.";
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
    scripts: [{ type: "application/ld+json", children: serializarJsonLd({ "@context": "https://schema.org", "@type": "WebSite", name: TITULO, url: URL_PAGINA, inLanguage: "pt-BR" }) }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold"><div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground"><Ticket className="h-4 w-4" /></div><span>NextSM</span></div>
          <Link to="/auth"><Button>Entrar</Button></Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-20">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">NextSM Service Desk</h1>
          <p className="mt-4 text-lg text-muted-foreground">Centralize chamados, atendimento, SLA e conhecimento em um único lugar.</p>
          <div className="mt-8 flex justify-center gap-3"><Link to="/auth"><Button size="lg">Acessar portal</Button></Link></div>
        </section>
        <section className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Zap, title: "Rápido e simples", desc: "Abertura e acompanhamento de chamados em poucos cliques." },
            { icon: ShieldCheck, title: "SLA controlado", desc: "Prioridades e prazos organizados para cada atendimento." },
            { icon: BookOpen, title: "Base de conhecimento", desc: "Encontre respostas e procedimentos em um único lugar." },
          ].map(({ icon: Icon, title, desc }) => <div key={title} className="rounded-lg border bg-card p-6"><Icon className="h-6 w-6 text-primary" /><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{desc}</p></div>)}
        </section>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} NextSM.</footer>
    </div>
  );
}
