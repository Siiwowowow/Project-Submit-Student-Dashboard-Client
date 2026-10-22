"use client";

import { useState } from "react";
import { UseQueryResult } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Eye, FolderGit2, MoveHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, getInitials, isAdmin, isReviewer } from "@/lib/dashboard-utils";
import type { Project, ProjectPage, SessionUser } from "@/types/project.types";
import { ProjectScore } from "./project-score";
import { ProjectLinks } from "./project-links";
import { StatusBadge } from "./status-badge";
import { EmptyState, ErrorState, LoadingState } from "./feedback-state";
import { ProjectDetailDialog } from "./project-detail-dialog";

interface Props {
  user: SessionUser;
  query: UseQueryResult<ProjectPage, Error>;
  filtered: boolean;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function ProjectTable({ user, query, filtered, page, limit, onPageChange, onLimitChange }: Props) {
  const reviewer = isReviewer(user.role);
  const [selected, setSelected] = useState<Project | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const openProject = (project: Project, action: typeof decision = null) => { setSelected(project); setDecision(action); };
  const { data, isPending, isError } = query;
  const total = data?.pagination.total || 0;
  const totalPages = data?.pagination.totalPages || 0;

  return <>
    {!!data?.projects.length && <p className="table-scroll-hint"><MoveHorizontal size={13} />Project links and actions</p>}
    {isPending ? <LoadingState /> : isError ? <ErrorState onRetry={() => void query.refetch()} /> : !data?.projects.length ? <EmptyState reviewer={reviewer} filtered={filtered} /> :
      <Table className="project-table" aria-label={reviewer ? "Student project submissions" : "Your project submissions"}><TableHeader><TableRow><TableHead>Project</TableHead>{reviewer && <TableHead>Submitted by</TableHead>}<TableHead>Status</TableHead>{!isAdmin(user.role) && <TableHead>Marks</TableHead>}<TableHead>Submitted</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {data.projects.map(project => <TableRow key={project.id}>
          <TableCell><div className="project-title-cell"><span className="table-project-icon"><FolderGit2 size={20} strokeWidth={1.6} /></span><div><button className="project-name" onClick={() => openProject(project)}>{project.name}</button><ProjectLinks project={project} compact /></div></div></TableCell>
          {reviewer && <TableCell><div className="student-cell"><span className="student-avatar">{getInitials(project.student.name)}</span><span>{project.student.name || project.student.email}</span></div></TableCell>}
          <TableCell><StatusBadge status={project.status} /></TableCell>{!isAdmin(user.role) && <TableCell><ProjectScore score={project.score} scoreOutOf={project.scoreOutOf} /></TableCell>}<TableCell className="date-cell">{formatDate(project.createdAt)}</TableCell>
          <TableCell><div className="row-actions">
            {reviewer && project.status === "PENDING" && project.studentId !== user.id && <>
              <Tooltip><TooltipTrigger asChild><button className="row-action action-approve" aria-label={"Approve " + project.name} onClick={() => openProject(project, "APPROVED")}><Check size={16} /></button></TooltipTrigger><TooltipContent>Approve project</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><button className="row-action action-reject" aria-label={"Reject " + project.name} onClick={() => openProject(project, "REJECTED")}><X size={16} /></button></TooltipTrigger><TooltipContent>Reject project</TooltipContent></Tooltip>
            </>}
            <Tooltip><TooltipTrigger asChild><button className="row-action" aria-label={"View " + project.name} onClick={() => openProject(project)}><Eye size={16} /></button></TooltipTrigger><TooltipContent>View project</TooltipContent></Tooltip>
          </div></TableCell>
        </TableRow>)}
      </TableBody></Table>}
    <div className="pagination-bar"><div className="pagination-summary">{total ? <>Showing <strong>{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> projects</> : "No projects to show"}<label className="page-size-label">Rows<select aria-label="Projects per page" value={limit} onChange={event => onLimitChange(Number(event.target.value))}><option value="5">5</option><option value="10">10</option><option value="20">20</option></select></label></div>
      <div className="pagination-controls"><Button variant="outline" className="pagination-arrow" aria-label="Previous page" disabled={page <= 1 || isPending} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} /></Button><span>Page <strong>{page}</strong> of {Math.max(1, totalPages)}</span><Button variant="outline" className="pagination-arrow" aria-label="Next page" disabled={page >= totalPages || isPending} onClick={() => onPageChange(page + 1)}><ChevronRight size={16} /></Button></div>
    </div>
    {selected && <ProjectDetailDialog key={selected.id + (decision || "")} project={selected} user={user} initialDecision={decision} onClose={() => setSelected(null)} onReviewed={() => onPageChange(1)} />}
  </>;
}
