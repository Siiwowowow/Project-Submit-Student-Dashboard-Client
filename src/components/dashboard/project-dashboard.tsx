"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Check, CircleDashed, Clock3, FolderGit2, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjects, getStatistics } from "@/services/project.services";
import { isReviewer } from "@/lib/dashboard-utils";
import type { SessionUser } from "@/types/project.types";
import { ProjectTable } from "./project-table";

export function ProjectDashboard({ user, view }: { user: SessionUser; view: "overview" | "projects" }) {
  const reviewer = isReviewer(user.role);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const projects = useQuery({
    queryKey: ["projects", user.id, page, limit, status],
    queryFn: () => getProjects(reviewer, page, limit, status),
    retry: 1,
  });
  const statistics = useQuery({
    queryKey: ["statistics", user.id],
    queryFn: () => getStatistics(reviewer),
    retry: 1,
  });
  const firstName = user.name?.trim().split(/\s+/)[0] || "there";
  const averagePercentage = statistics.data?.averageScore;
  const changeFilter = (value: string) => { setStatus(value); setPage(1); };
  const stats = [
    { label: reviewer ? "Total submissions" : "Your projects", value: statistics.data?.totalProjects, icon: FolderGit2, filter: "", className: "stat-neutral", caption: reviewer ? "Every idea, in one place" : "Ideas you’ve put into the world" },
    { label: "Pending review", value: statistics.data?.totalPending, icon: Clock3, filter: "PENDING", className: "stat-amber", caption: "A fresh perspective is on its way" },
    { label: "Approved", value: statistics.data?.totalApproved, icon: Check, filter: "APPROVED", className: "stat-green", caption: "Good work, recognized" },
    { label: "Rejected", value: statistics.data?.totalRejected, icon: X, filter: "REJECTED", className: "stat-slate", caption: "Feedback for the next iteration" },
  ];

  return <div className="page-enter">
    <div className="page-heading"><div><span className="section-kicker">{reviewer ? "THE REVIEW DESK" : "YOUR LITTLE CORNER"}</span><h1>{view === "projects" ? (reviewer ? "All submissions" : "My projects") : <>Hello, {firstName}<span className="text-primary">.</span></>}</h1><p>{view === "projects" ? "Good ideas, works in progress, and everything you’ve learned along the way." : reviewer ? "A little of your perspective can take a project a long way." : "Here’s where your ideas take their next step."}</p></div>{!reviewer && <Button asChild className="primary-button"><Link href="/dashboard/new"><Plus size={17} />Submit a project</Link></Button>}</div>

    {view === "overview" && <section className="welcome-banner">
      <div><span className="banner-kicker"><span className="pink-dot" />{reviewer ? "MAKE ROOM FOR GROWTH" : "FROM YOUR EDITOR, TO HERE"}</span><h2>{reviewer ? <>Great work starts with<br /><em>thoughtful feedback.</em></> : <>Every project is a<br /><em>step forward.</em></>}</h2><p>{reviewer ? "Look a little closer. Leave a useful note. Help someone see what’s next." : "It doesn’t have to be perfect. Share what you’ve made, and let’s take it from there."}</p>{reviewer ? <button className="text-action" onClick={() => { changeFilter("PENDING"); document.getElementById("projects-section")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Visit the review queue<ArrowRight size={16} /></button> : <Link className="text-action" href="/dashboard/new">Let’s see what you’re building<ArrowRight size={16} /></Link>}</div>
      <div className="banner-art" aria-hidden="true"><div className="banner-paper back" /><div className="banner-paper front"><span className="art-corner"><FolderGit2 size={20} /></span><span className="art-line long" /><span className="art-line" /><div className="art-code"><span /><span /><span /></div><span className="art-tick"><Check size={15} />One step closer</span></div><span className="art-arrow"><ArrowDownLeft size={36} strokeWidth={1} /></span><span className="art-caption">little by little.</span></div>
    </section>}

    <section className="statistics-grid" aria-label="Project statistics">
      {stats.map(({ label, value, icon: Icon, filter, className, caption }) => <button key={label} className={"stat-card " + className + (status === filter ? " stat-selected" : "")} onClick={() => changeFilter(filter)} aria-label={label + ": " + (value ?? "loading") + ". Filter projects."}>
        <span className="stat-topline"><span className="stat-label">{label}</span><span className="stat-icon"><Icon size={18} strokeWidth={1.7} /></span></span><span className="stat-value">{statistics.isPending ? <span className="stat-skeleton" /> : value ?? "—"}</span><span className="stat-caption">{caption}<ArrowUpRight size={13} /></span>
      </button>)}
    </section>
    {!reviewer && <section className="marks-summary" aria-label="Marks overview">
      <h2>Average marks</h2>
      <output className="marks-average" aria-label="Average marks"><strong>{statistics.isPending ? "..." : averagePercentage == null ? "—" : averagePercentage.toFixed(1)}</strong><span>%</span></output>
    </section>}
    {statistics.isError && <div className="inline-notice" role="alert">Statistics couldn’t load.<button onClick={() => void statistics.refetch()}>Try again</button></div>}
    <section className="projects-panel" id="projects-section">
      <div className="panel-heading"><div><h2>{reviewer ? "Project submissions" : "Your submissions"}<span className="count-pill">{statistics.data?.totalProjects ?? "—"}</span></h2><p>{reviewer ? "A closer look at the work coming your way." : "A little collection of what you’re creating."}</p></div><Button variant="outline" className="refresh-button" disabled={projects.isFetching || statistics.isFetching} onClick={() => { void projects.refetch(); void statistics.refetch(); }} aria-label="Refresh submissions"><RefreshCw size={15} className={projects.isFetching ? "animate-spin" : ""} /><span>Refresh</span></Button></div>
      <div className="table-toolbar">
        <div className="status-tabs" aria-label="Filter projects by status">
          {[["", "All projects"], ["PENDING", "Pending"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"]].map(([value, label]) => <button key={value} aria-pressed={status === value} className={status === value ? "selected" : ""} onClick={() => changeFilter(value)}>{value === "PENDING" ? <CircleDashed size={14} /> : value === "APPROVED" ? <Check size={14} /> : value === "REJECTED" ? <X size={14} /> : null}{label}</button>)}
        </div>
        <span className="table-sort">Newest first <ArrowDownLeft size={13} className="-rotate-45" /></span>
      </div>
      <ProjectTable user={user} query={projects} filtered={!!status} page={page} limit={limit} onPageChange={setPage} onLimitChange={value => { setLimit(value); setPage(1); }} />
    </section>
    <div className="below-table-note"><span className="pink-dot" /><span>{reviewer ? "Useful feedback is specific, kind, and points to a next step." : "A project is a snapshot of your progress. Keep making things."}</span></div>
  </div>;
}
