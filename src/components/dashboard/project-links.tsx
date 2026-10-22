import { ArrowUpRight, GitBranch, Globe } from "lucide-react";
import { shortRepo } from "@/lib/dashboard-utils";
import type { Project } from "@/types/project.types";

export function ProjectLinks({ project, compact = false }: { project: Project; compact?: boolean }) {
  if (compact) return <div className="project-inline-links">
    <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="project-resource-link project-live-link" aria-label={`Live project: ${project.liveLink} (opens in a new tab)`}>
      <Globe size={14} aria-hidden="true" />
      <span>{project.liveLink}</span>
      <ArrowUpRight className="resource-arrow" size={13} aria-hidden="true" />
    </a>
  </div>;

  const links = [
    { label: "Frontend", url: project.repoUrl, icon: GitBranch, repository: true },
    { label: "Backend", url: project.backendRepoUrl, icon: GitBranch, repository: true },
    { label: "Live project", url: project.liveLink, icon: Globe, repository: false },
  ];

  return <div className={compact ? "project-inline-links" : "project-link-grid"}>
    {links.map(({ label, url, icon: Icon, repository }) => url ?
      <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="project-resource-link" aria-label={`${label}: ${repository ? shortRepo(url) : url} (opens in a new tab)`}>
        <Icon size={compact ? 14 : 19} aria-hidden="true" />
        <span><strong>{label}{!compact && repository ? " repository" : ""}</strong><small>{repository ? shortRepo(url) : url}</small></span>
        <ArrowUpRight className="resource-arrow" size={compact ? 13 : 17} aria-hidden="true" />
      </a> :
      <div key={label} className="project-resource-link resource-unavailable"><Icon size={compact ? 14 : 19} aria-hidden="true" /><span><strong>{label}{!compact && repository ? " repository" : ""}</strong><small>Not provided</small></span></div>)}
  </div>;
}
