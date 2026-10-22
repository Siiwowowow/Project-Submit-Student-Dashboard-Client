"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, FolderGit2, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectScore } from "./project-score";
import { FeedbackEditor } from "./feedback-editor";
import { MentorFeedback } from "./mentor-feedback";
import { feedbackRuns, type FeedbackRun } from "@/lib/feedback-format";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError, markProject, reviewProject, updateFeedback } from "@/services/project.services";
import { formatDate, isAdmin, isReviewer } from "@/lib/dashboard-utils";
import type { Project, SessionUser } from "@/types/project.types";
import { ProjectLinks } from "./project-links";
import { StatusBadge } from "./status-badge";

type Decision = "APPROVED" | "REJECTED";

export function ProjectDetailDialog({ project, user, initialDecision, onClose, onReviewed }: {
  project: Project; user: SessionUser; initialDecision: Decision | null; onClose: () => void; onReviewed: () => void;
}) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<Decision | null>(initialDecision);
  const [comment, setComment] = useState(project.reviewComment || "");
  const [commentFormat, setCommentFormat] = useState<FeedbackRun[]>(feedbackRuns(project.reviewComment || "", project.reviewCommentFormat));
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(project.score == null ? "" : String(project.score));
  const [scoreOutOf, setScoreOutOf] = useState(String(project.scoreOutOf ?? 100));
  const parseTotal = () => {
    const total = Number(scoreOutOf);
    if (!scoreOutOf.trim() || !Number.isInteger(total) || total < 1 || total > 10000) throw new Error("Enter total marks from 1 to 10,000.");
    return total;
  };
  const parseScore = () => {
    const value = Number(score);
    if (!score.trim() || !Number.isInteger(value) || value < 0 || value > parseTotal()) throw new Error("Enter obtained marks from 0 to " + parseTotal() + ".");
    return value;
  };
  const canReview = isReviewer(user.role) && project.status === "PENDING" && project.studentId !== user.id;
  const review = useMutation({
    mutationFn: async (status: Decision) => reviewProject(project.id, status, comment, score.trim() ? parseScore() : undefined, commentFormat, parseTotal()),
    onSuccess: async (_, status) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["statistics"] }),
      ]);
      toast.success(status === "APPROVED" ? "Project approved. A little encouragement goes a long way." : "Review saved. Your feedback is on its way.");
      onClose();
      onReviewed();
    },
    onError: (failure) => {
      setError(failure.message);
      if (failure instanceof ApiError && failure.status === 409) {
        void queryClient.invalidateQueries({ queryKey: ["projects"] });
        void queryClient.invalidateQueries({ queryKey: ["statistics"] });
      }
    },
  });

  const marks = useMutation({
    mutationFn: async () => markProject(project.id, parseScore(), parseTotal()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["statistics"] }),
      ]);
      toast.success("Marks saved.");
      onClose();
    },
    onError: failure => setError(failure.message),
  });
  const feedback = useMutation({
    mutationFn: () => updateFeedback(project.id, comment, commentFormat),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Mentor feedback updated.");
      onClose();
    },
    onError: failure => setError(failure.message),
  });
  const busy = review.isPending || marks.isPending || feedback.isPending;
  const editor = <FeedbackEditor initialText={comment} initialFormat={commentFormat} disabled={busy} onChange={(text, runs) => { setComment(text); setCommentFormat(runs); setError(""); }} />;
  const marksField = <div className="marks-field"><h3>Project marks</h3><div className="marks-input-grid"><div><label htmlFor="project-total">Total marks</label><Input id="project-total" type="number" inputMode="numeric" min={1} max={10000} step={1} value={scoreOutOf} onChange={event => { setScoreOutOf(event.target.value); setError(""); }} disabled={busy} placeholder="e.g. 60" aria-describedby="score-hint" /></div><div><label htmlFor="project-score">Obtained marks</label><Input id="project-score" type="number" inputMode="numeric" min={0} max={Number(scoreOutOf) || 100} step={1} value={score} onChange={event => { setScore(event.target.value); setError(""); }} disabled={busy} placeholder="e.g. 45" aria-describedby="score-hint" /></div></div><p id="score-hint" className="form-helper">Choose the total for this project, then enter the obtained marks. The average uses each project&apos;s percentage.</p></div>;

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="project-dialog" showCloseButton={!busy}>
    <DialogHeader><div className="detail-topline"><span className="dialog-icon"><FolderGit2 size={24} /></span><StatusBadge status={project.status} /></div><DialogTitle className="detail-title">{project.name}</DialogTitle><DialogDescription>Submitted by {project.student.name || project.student.email} · {formatDate(project.createdAt)}</DialogDescription></DialogHeader>
    {project.status !== "PENDING" && <MentorFeedback project={project} />}
    {isReviewer(user.role) && project.status !== "PENDING" && project.studentId !== user.id && <div className="feedback-edit-section">{editingFeedback ? <><h3>Edit mentor feedback</h3>{editor}{error && <p className="field-error" role="alert">{error}</p>}<div className="feedback-edit-actions"><Button variant="outline" disabled={busy} onClick={() => { setEditingFeedback(false); setError(""); }}>Cancel</Button><Button className="primary-button" disabled={busy || !comment.trim() || comment.length > 1000} onClick={() => feedback.mutate()}>{feedback.isPending && <LoaderCircle className="animate-spin" size={16} />}Save feedback</Button></div></> : <Button variant="outline" onClick={() => { setComment(project.reviewComment || ""); setCommentFormat(feedbackRuns(project.reviewComment || "", project.reviewCommentFormat)); setEditingFeedback(true); }}>Edit feedback</Button>}</div>}
    <div className="detail-description"><span className="detail-label">THE IDEA</span><p>{project.description}</p></div>
    <ProjectLinks project={project} />
    {!isAdmin(user.role) && <ProjectScore score={project.score} scoreOutOf={project.scoreOutOf} detailed />}
    {isReviewer(user.role) && project.status !== "PENDING" && project.studentId !== user.id && <div className="review-section">{marksField}{error && <p className="field-error" role="alert">{error}</p>}<Button className="primary-button" disabled={busy} onClick={() => marks.mutate()}>{marks.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}{project.score == null ? "Save marks" : "Update marks"}</Button></div>}
    {canReview && <div className="review-section">
      {decision ? <><div className="review-section-heading"><h3>{decision === "APPROVED" ? "Give this project the green light." : "Help this project take its next step."}</h3><button disabled={busy} className="small-text-button" onClick={() => { setDecision(null); setError(""); }}>Change decision</button></div>{marksField}<label htmlFor="review-comment">A note for the student <span>(optional)</span></label>{editor}{error && <p className="field-error" role="alert">{error}</p>}<Button className={"primary-button w-full " + (decision === "REJECTED" ? "reject-confirm" : "")} disabled={busy} onClick={() => review.mutate(decision)}>{review.isPending ? <LoaderCircle className="animate-spin" size={16} /> : decision === "APPROVED" ? <Check size={17} /> : <X size={17} />}{review.isPending ? "Saving your review…" : decision === "APPROVED" ? "Confirm approval" : "Confirm rejection"}</Button><p className="decision-note">This decision is final. Take a moment before you confirm.</p></>
        : <><h3>What’s your take?</h3><p className="form-helper">A thoughtful decision helps the student move forward.</p><div className="review-button-row"><Button variant="outline" className="h-11 action-reject" onClick={() => setDecision("REJECTED")}><X size={16} />Reject project</Button><Button className="primary-button" onClick={() => setDecision("APPROVED")}><Check size={16} />Approve project</Button></div></>}
    </div>}
  </DialogContent></Dialog>;
}
