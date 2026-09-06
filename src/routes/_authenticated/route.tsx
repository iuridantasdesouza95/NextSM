import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Ticket, PlusCircle, BookOpen, LogOut, Users, FolderTree, ShieldCheck, MessageSquare, BarChart3, Settings2, Building2, ArrowLeftRight, FileText, ListChecks, Moon, Sun, ChevronRight, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NotificationBell } from "@/components/NotificationBell";
import { NextSMLogo } from "@/components/brand/NextSMLogo";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

function getArea() {
  try {
    const v = localStorage.getItem("service_desk_segmento");
    return v ? (JSON.parse(v) as { id: string; nome: string }) : null;
  } catch {
    return null;
  }
}

function getItsmModule(pathname: string) {
  if (pathname === "/itsm-problemas") return "problemas";
  if (pathname === "/itsm-mudancas") return "mudancas";
  if (pathname === "/itsm-ativos") return "ativos";
  if (pathname === "/itsm-relacionamentos") return "relacionamentos";
  if (pathname === "/itsm-servicos") return "servicos";
  if (pathname === "/itsm-conhecimento") return "conhecimento";
  if (pathname === "/itsm-auditoria") return "auditoria";
  if (pathname === "/itsm-governanca") return "governanca";
  if (pathname.startsWith("/admin/catalogo")) return "catalogo";
  return null;
}

function AppShell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [darkMode, setDarkMode] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: roles = [] } = useQuery({
    queryKey: ["my-roles", user.id],
    enabled: !signingOut,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return (data ?? []).map((r) => r.role as string);
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user.id],
    enabled: !signingOut,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("nome,email").eq("id", user.id).maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const displayName = profile?.nome?.trim() || profile?.email?.trim() || user.email || "Usuário";

  const { data: itsmPermissions = [] } = useQuery({
    queryKey: ["my-itsm-permissions", user.id],
    enabled: !signingOut && roles.length > 0 && !roles.includes("admin"),
    queryFn: async () => {
      const { data } = await supabase.from("itsm_permissoes_usuario").select("modulo,visualizar").eq("user_id", user.id).eq("visualizar", true);
      return data ?? [];
    },
  });

  const itsmModule = getItsmModule(pathname);

  const { data: itsmActionPermission } = useQuery({
    queryKey: ["my-itsm-action-permission", user.id, itsmModule],
    enabled: !signingOut && !!itsmModule && roles.length > 0,
    queryFn: async () => {
      if (!itsmModule) return null;
      if (roles.includes("admin")) return { visualizar: true, criar: true, editar: true, atribuir: true, excluir: true };
      const { data, error } = await supabase.from("itsm_permissoes_usuario").select("visualizar,criar,editar,atribuir,excluir").eq("user_id", user.id).eq("modulo", itsmModule).maybeSingle();
      if (error) throw error;
      return { visualizar: !!data?.visualizar, criar: !!data?.criar, editar: !!data?.editar, atribuir: !!data?.atribuir, excluir: !!data?.excluir };
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem("nextsm-theme");
    const dark = saved === "dark";
    setDarkMode(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("nextsm-theme", next ? "dark" : "light");
  };

  useEffect(() => {
    if (!itsmModule || !itsmActionPermission) return;
    const sync = () => {
      document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        const text = (button.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
        let action: null | "criar" | "editar" | "atribuir" | "excluir" = null;
        if (/(^|\s)novo(\s|$)/.test(text) || text.includes("novo ")) action = "criar";
        else if (text.includes("editar")) action = "editar";
        else if (text.includes("atribuir")) action = "atribuir";
        else if (text.includes("excluir")) action = "excluir";
        if (!action) return;
        if (itsmActionPermission[action]) {
          if (button.dataset.itsmPermissionHidden === "true") {
            button.style.removeProperty("display");
            delete button.dataset.itsmPermissionHidden;
          }
        } else {
          button.style.setProperty("display", "none", "important");
          button.dataset.itsmPermissionHidden = "true";
        }
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, [itsmModule, itsmActionPermission]);

  const isAreas = pathname === "/areas";
  const area = getArea();
  const isStaff = roles.some((r) => ["atendente", "gestor", "admin"].includes(r));
  const canDashboard = roles.some((r) => ["colaborador", "atendente", "gestor", "admin"].includes(r));
  const canGestao = roles.some((r) => ["gestor", "admin"].includes(r));
  const isAdmin = roles.includes("admin");
  const canItsm = isAdmin || itsmPermissions.length > 0;

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  if (isAreas) return <main className="min-h-screen bg-muted/20"><Outlet /></main>;

  const sections = [
    { title: "PRINCIPAL", items: [
      { to: "/areas", icon: Building2, label: "Áreas" },
      ...(canDashboard ? [{ to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }] : []),
      ...(canGestao ? [{ to: "/gestao", icon: BarChart3, label: "Gestão" }] : []),
      { to: "/chamados/novo", icon: PlusCircle, label: "Novo chamado" },
      { to: "/chamados", icon: Ticket, label: "Meus chamados" },
      { to: "/catalogo", icon: ListChecks, label: "Catálogo" },
      { to: "/base-conhecimento", icon: BookOpen, label: "Base de conhecimento" },
    ]},
    ...(isStaff ? [{ title: "ATENDIMENTO", items: [{ to: "/fila", icon: Users, label: "Fila de atendimento" }] }] : []),
    ...(canItsm ? [{ title: "ITSM", items: [{ to: "/itsm-avancado", icon: Settings2, label: "ITSM Avançado" }] }] : []),
    ...(isAdmin ? [{ title: "ADMIN", items: [
      { to: "/admin", icon: ShieldCheck, label: "Painel admin" },
      { to: "/admin/itsm-permissoes", icon: Settings2, label: "Permissões ITSM" },
      { to: "/admin/documentacao", icon: FileText, label: "Documentação do sistema" },
      { to: "/admin/categorias", icon: FolderTree, label: "Categorias" },
      { to: "/admin/usuarios", icon: Users, label: "Usuários" },
      { to: "/admin/assistente", icon: MessageSquare, label: "Conversas IA" },
    ] }] : []),
  ];

  const sidebar = <aside className="nextsm-sidebar flex h-full min-h-0 w-[272px] shrink-0 flex-col overflow-hidden border-r">
    <div className="nextsm-sidebar__brand shrink-0"><NextSMLogo inverse /><div className="nextsm-sidebar__status"><span />Service Management</div></div>
    <div className="nextsm-sidebar__area shrink-0"><div className="nextsm-sidebar__area-label">Área atual</div><div className="flex items-center gap-3"><div className="nextsm-sidebar__area-icon"><Building2 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-white">{area?.nome ?? "Não selecionada"}</div><div className="truncate text-xs text-slate-400">Ambiente operacional</div></div></div><Button variant="ghost" size="sm" className="mt-3 w-full justify-between text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => navigate({ to: "/areas" })}>Trocar área<ArrowLeftRight className="h-4 w-4" /></Button></div>
    <nav className="nextsm-sidebar__nav min-h-0 flex-1 overflow-y-auto overscroll-contain">{sections.map(section => <div key={section.title} className="mb-5"><p className="nextsm-sidebar__section">{section.title}</p><div className="space-y-1">{section.items.map(({ to, icon: Icon, label }) => { const active = to === "/chamados" ? pathname === "/chamados" : to === "/chamados/novo" ? pathname === "/chamados/novo" : pathname === to || (to !== "/dashboard" && to !== "/admin" && pathname.startsWith(to)) || (to === "/admin" && pathname === "/admin"); return <Link key={to} to={to} className={`nextsm-nav-item ${active ? "is-active" : ""}`}><Icon className="h-[17px] w-[17px]" /><span>{label}</span>{active && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}</Link>; })}</div></div>)}</nav>
    <div className="nextsm-sidebar__footer shrink-0"><div className="mb-3 flex items-center gap-3 px-2"><div className="nextsm-avatar">{displayName.charAt(0).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-sm font-semibold text-white">{displayName}</div><div className="text-[11px] text-slate-400">{isAdmin ? "Administrador" : "Usuário"}</div></div></div><div className="grid grid-cols-2 gap-2"><Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={toggleTheme}>{darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}{darkMode ? "Claro" : "Escuro"}</Button><Button disabled={signingOut} variant="ghost" size="sm" className="text-slate-300 hover:bg-red-500/10 hover:text-red-300" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />{signingOut ? "Saindo..." : "Sair"}</Button></div></div>
  </aside>;

  return <div className="nextsm-shell flex min-h-screen min-w-0 bg-muted/20">
    <div className="hidden md:flex">{sidebar}</div>
    {mobileMenuOpen && <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu de navegação"><button className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} /> <div className="relative z-10 h-full w-[min(86vw,320px)] overflow-hidden shadow-2xl">{sidebar}</div></div>}
    <main className="min-w-0 flex-1 overflow-x-auto"><header className="nextsm-topbar flex h-16 items-center justify-between px-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button><div className="md:hidden shrink-0"><NextSMLogo compact /></div><span className="hidden truncate text-sm font-medium text-slate-500 sm:block">Workspace / {area?.nome ?? "Área"}</span></div><div className="flex shrink-0 items-center gap-1 sm:gap-2">{!signingOut && <NotificationBell userId={user.id} />}<Button variant="ghost" size="sm" onClick={toggleTheme} aria-label={darkMode ? "Ativar tema claro" : "Ativar tema escuro"}>{darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button><Button disabled={signingOut} variant="ghost" size="icon" className="md:hidden text-destructive" onClick={handleSignOut} aria-label="Sair do portal"><LogOut className="h-4 w-4" /></Button></div></header><div className="min-w-0 p-3 sm:p-6"><Outlet /></div></main>
  </div>;
}