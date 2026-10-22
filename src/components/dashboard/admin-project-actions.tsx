"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FeedbackEditor } from "./feedback-editor";
import { feedbackRuns, type FeedbackRun } from "@/lib/feedback-format";
import { ApiError, deleteProject, updateProject } from "@/services/project.services";
import type { Project, ProjectAdminInput } from "@/types/project.types";

export function AdminProjectActions({ project, onSaved }: { project: Project; onSaved: () => void }) {
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  return <>
    <button className="row-action" aria-label={"Edit " + project.name} title="Edit project" onClick={() => setMode("edit")}><Pencil size={15} /></button>
    <button className="row-action action-reject" aria-label={"Delete " + project.name} title="Delete project" onClick={() => setMode("delete")}><Trash2 size={15} /></button>
    {mode && <ProjectManagementDialog project={project} mode={mode} onClose={() => setMode(null)} onSaved={onSaved} />}
  </>;
}

function ProjectManagementDialog({ project, mode, onClose, onSaved }: {
  project: Project; mode: "edit" | "delete"; onClose: () => void; onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState(project.reviewComment || "");
  const [format, setFormat] = useState<FeedbackRun[]>(feedbackRuns(comment, project.reviewCommentFormat));
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: async (input?: ProjectAdminInput) => mode === "delete" ? deleteProject(project.id) : updateProject(project.id, input!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["statistics"] }),
      ]);
      toast.success(mode === "delete" ? "Project deleted." : "Project updated.");
      onClose(); onSaved();
    },
    onError: failure => setError(failure instanceof ApiError && Object.keys(failure.fields).length ? Object.values(failure.fields).join(" ") : failure.message),
  });

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const backend = String(form.get("backendRepoUrl") || "").trim();
    const score = String(form.get("score") || "").trim();
    mutation.mutate({
      name: String(form.get("name")), repoUrl: String(form.get("repoUrl")),
      ...(backend ? { backendRepoUrl: backend } : {}),
      liveLink: String(form.get("liveLink")), description: String(form.get("description")),
      status: String(form.get("status")) as Project["status"],
      scoreOutOf: Number(form.get("scoreOutOf")), score: score ? Number(score) : null,
      reviewComment: comment || null, ...(comment ? { reviewCommentFormat: format } : {}),
    });
  }

  return <Dialog open onOpenChange={open => { if (!open && !mutation.isPending) onClose(); }}><DialogContent className="management-dialog" showCloseButton={!mutation.isPending}>
    <DialogHeader><DialogTitle>{mode === "delete" ? "Delete project" : "Edit project"}</DialogTitle><DialogDescription>{project.name}</DialogDescription></DialogHeader>
    {mode === "delete" ? <><p className="management-notice">This permanently removes this submission, its marks and feedback. This action cannot be undone.</p>{error && <p className="field-error" role="alert">{error}</p>}<div className="management-actions"><Button variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button><Button className="danger-button" disabled={mutation.isPending} onClick={() => mutation.mutate(undefined)}>{mutation.isPending && <LoaderCircle className="animate-spin" size={16} />}Delete permanently</Button></div></> :
      <form className="management-form" onSubmit={save}>
        <fieldset disabled={mutation.isPending}>
          <div className="form-field"><label htmlFor="edit-project-name">Project name</label><Input id="edit-project-name" name="name" defaultValue={project.name} minLength={3} maxLength={150} required /></div>
          <div className="form-field"><label htmlFor="edit-frontend">Frontend repository URL</label><Input id="edit-frontend" name="repoUrl" type="url" defaultValue={project.repoUrl} required maxLength={2048} /></div>
          <div className="form-field"><label htmlFor="edit-backend">Backend repository URL (optional)</label><Input id="edit-backend" name="backendRepoUrl" type="url" defaultValue={project.backendRepoUrl || ""} maxLength={2048} /></div>
          <div className="form-field"><label htmlFor="edit-live">Live project URL</label><Input id="edit-live" name="liveLink" type="url" defaultValue={project.liveLink} required maxLength={2048} /></div>
          <div className="form-field"><label htmlFor="edit-description">Description</label><Textarea id="edit-description" name="description" defaultValue={project.description} minLength={20} maxLength={5000} required /></div>
          <div className="form-field"><label htmlFor="edit-status">Project status</label><select className="management-select" id="edit-status" name="status" defaultValue={project.status}><option value="PENDING">Pending review</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select><p className="form-helper">Reopening as pending clears the previous marks and feedback.</p></div>
          <div className="marks-input-grid"><div className="form-field"><label htmlFor="edit-total">Total marks</label><Input id="edit-total" name="scoreOutOf" type="number" min={1} max={10000} step={1} defaultValue={project.scoreOutOf} required /></div><div className="form-field"><label htmlFor="edit-score">Obtained marks (optional)</label><Input id="edit-score" name="score" type="number" min={0} max={10000} step={1} defaultValue={project.score ?? ""} /></div></div>
          <div><label className="management-label">Mentor feedback</label><FeedbackEditor disabled={mutation.isPending} initialText={project.reviewComment || ""} initialFormat={project.reviewCommentFormat} onChange={(text, runs) => { setComment(text); setFormat(runs); }} /></div>
        </fieldset>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="management-actions"><Button variant="outline" type="button" disabled={mutation.isPending} onClick={onClose}>Cancel</Button><Button className="primary-button" type="submit" disabled={mutation.isPending}>{mutation.isPending && <LoaderCircle className="animate-spin" size={16} />}Save project</Button></div>
      </form>}
  </DialogContent></Dialog>;
}
