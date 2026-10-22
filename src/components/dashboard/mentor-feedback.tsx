import { MessageSquareText } from "lucide-react";
import { feedbackRuns } from "@/lib/feedback-format";
import { formatDate } from "@/lib/dashboard-utils";
import type { Project } from "@/types/project.types";

export function MentorFeedback({ project }: { project: Project }) {
  return <section className="mentor-feedback" aria-label="Mentor feedback">
    <div className="mentor-feedback-heading"><span><MessageSquareText size={23} /></span><div><small>START HERE</small><h3>Mentor feedback &amp; next steps</h3></div></div>
    <p className="mentor-feedback-intro">Read these notes first. Use them to improve your project.</p>
    <div className="mentor-feedback-content">{project.reviewComment ? feedbackRuns(project.reviewComment, project.reviewCommentFormat).map((run, index) => <span key={index} data-feedback-color={run.color} style={{ fontWeight: run.bold ? 700 : 400, textDecoration: run.underline ? "underline" : "none" }}>{run.text}</span>) : <strong>Your mentor has reviewed this project without additional feedback.</strong>}</div>
    <footer>Mentor{project.reviewedAt ? " · " + formatDate(project.reviewedAt) : ""}</footer>
  </section>;
}
