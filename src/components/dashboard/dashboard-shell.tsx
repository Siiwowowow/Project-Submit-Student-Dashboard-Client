"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronRight, FolderGit2, LayoutGrid, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, X, ArrowUpRight, Check, UserRound, Users } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getInitials, isAdmin, isReviewer, roleLabel } from "@/lib/dashboard-utils";
import { useAuth } from "@/providers/AuthProvider";
import type { SessionUser } from "@/types/project.types";

export function DashboardShell({ children, user }: { children: React.ReactNode; user: SessionUser }) {
  const pathname = usePathname();
  const reviewer = isReviewer(user.role);
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutGrid },
    { href: "/dashboard/projects", label: reviewer ? "All submissions" : "My projects", icon: FolderGit2 },
    ...(isAdmin(user.role) ? [{ href: "/dashboard/users", label: "Manage users", icon: Users }] : []),
    ...(!reviewer ? [{ href: "/dashboard/new", label: "Submit a project", icon: Plus }] : []),
  ];
  const title = pathname.endsWith("/users") ? "Manage users" : pathname.endsWith("/new") ? "New submission" : pathname.endsWith("/projects") ? (reviewer ? "All submissions" : "My projects") : "Overview";

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        mobileTrigger.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return <div className="dashboard-app" data-sidebar={collapsed ? "collapsed" : "expanded"}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside id="workspace-sidebar" aria-label="Workspace sidebar" className={"workspace-sidebar " + (mobileOpen ? "sidebar-is-open" : "")}>
      <div className="sidebar-brand"><Brand /><button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={20} /></button></div>
      <div className="workspace-label"><span className="workspace-symbol">{reviewer ? "R" : "S"}</span><div><strong>{reviewer ? "Review workspace" : "Student workspace"}</strong><span>A place to make progress</span></div></div>
      <span className="nav-kicker">WORKSPACE</span>
      <nav aria-label="Main navigation">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} title={collapsed ? label : undefined} aria-label={label} className={"sidebar-link " + (pathname === href ? "active" : "")} aria-current={pathname === href ? "page" : undefined} onClick={() => setMobileOpen(false)}><Icon size={19} strokeWidth={1.7} /><span className="nav-link-label">{label}</span>{pathname === href && <span className="nav-active-dot" />}</Link>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><BookOpen size={20} /><h3>Project guide</h3><p>{reviewer ? "A practical guide to useful, constructive feedback." : "A quick checklist before your next submission."}</p><button onClick={() => setGuideOpen(true)}>Read the guide<ArrowUpRight size={15} /></button></div>
        <button className="guide-shortcut icon-button" aria-label="Open project guide" title="Project guide" onClick={() => setGuideOpen(true)}><BookOpen size={20} /></button>
        <button className="sidebar-account" aria-label="View account details" title={collapsed ? user.name || "Your account" : undefined} onClick={() => setAccountOpen(true)}><span className="user-avatar">{getInitials(user.name)}</span><span className="account-text"><strong>{user.name || "Your account"}</strong><small>{roleLabel(user.role)} account</small></span><ChevronRight size={15} /></button>
        <button className="logout-button" aria-label="Sign out" title={collapsed ? "Sign out" : undefined} disabled={loggingOut} onClick={async () => { setLoggingOut(true); try { await logout(); } finally { setLoggingOut(false); } }}><LogOut size={17} /><span>{loggingOut ? "Signing out…" : "Sign out"}</span></button>
      </div>
    </aside>
    <div className="workspace-main">
      <header className="workspace-topbar">
        <div className="breadcrumb-line">
          <button className="desktop-sidebar-toggle icon-button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} aria-controls="workspace-sidebar" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button>
          <button ref={mobileTrigger} className="mobile-menu icon-button" aria-label="Open navigation" aria-expanded={mobileOpen} aria-controls="workspace-sidebar" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span>Workspace</span><ChevronRight size={13} /><strong>{title}</strong>
        </div>
        <div className="topbar-right"><ThemeToggle /><span className="role-indicator"><span />{roleLabel(user.role)} view</span><span className="topbar-divider" /><button className="user-avatar avatar-small" aria-label="View your account" onClick={() => setAccountOpen(true)}>{getInitials(user.name)}</button></div>
      </header>
      <main id="main-content" className="workspace-content">{children}</main>
      <footer className="workspace-footer"><span>A little better, one project at a time.</span><span>Made for your next step<span className="pink-dot" /></span></footer>
    </div>
    <Dialog open={guideOpen} onOpenChange={setGuideOpen}><DialogContent className="guide-dialog"><DialogHeader><span className="dialog-icon"><BookOpen size={23} /></span><DialogTitle className="text-2xl">A thoughtful hand-in.</DialogTitle><DialogDescription>A few small things that make reviewing your project easier.</DialogDescription></DialogHeader><ol className="guide-list">
      {[
        ["Give it a clear name", "A short, descriptive project name is a great place to start."],
        ["Share the repository root", "Use a GitHub, GitLab or Bitbucket repository URL. Make sure your reviewer can access it."],
        ["Check the live link", "Open it in a private window. Does everything work as expected?"],
        ["Tell the story", "What did you build, what did you learn, and what would you improve next?"],
      ].map(([heading, description], index) => <li key={heading}><span>{index + 1}</span><div><h4>{heading}</h4><p>{description}</p></div></li>)}
    </ol><p className="guide-footnote"><Check size={15} />Progress matters more than perfection.</p></DialogContent></Dialog>
    <Dialog open={accountOpen} onOpenChange={setAccountOpen}><DialogContent className="account-dialog"><DialogHeader><span className="dialog-icon"><UserRound size={23} /></span><DialogTitle className="text-2xl">Your corner of Hand-in.</DialogTitle><DialogDescription>Your account details, all in one place.</DialogDescription></DialogHeader><dl className="account-details"><div><dt>Name</dt><dd>{user.name || "Student"}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Workspace</dt><dd>{roleLabel(user.role)}</dd></div></dl><Button variant="outline" className="h-11" onClick={() => setAccountOpen(false)}>Back to your workspace</Button></DialogContent></Dialog>
  </div>;
}
