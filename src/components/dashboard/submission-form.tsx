"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, FileText, FolderGit2, GitBranch, Globe, Lightbulb, LoaderCircle, LockKeyhole } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/form-error";
import { ApiError, submitProject } from "@/services/project.services";
import type { ProjectInput } from "@/types/project.types";

const httpUrl = z.string().trim().max(2048).url("Enter a complete URL, starting with https://.").refine(value => {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}, "Use an HTTP or HTTPS link without embedded credentials.");

const projectSchema = z.object({
  name: z.string().trim().min(3, "Give your project a name with at least 3 characters.").max(150),
  repoUrl: httpUrl,
  backendRepoUrl: httpUrl,
  liveLink: httpUrl,
  description: z.string().trim().min(20, "Add a little more detail — at least 20 characters.").max(5000),
});

export function SubmissionForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useMutation({
    mutationFn: (project: ProjectInput) => submitProject(project),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["statistics"] }),
      ]);
      toast.success("It’s handed in. Your project is ready for a fresh pair of eyes.");
      router.push("/dashboard/projects");
    },
    onError: error => {
      if (error instanceof ApiError) {
        setErrors(error.fields);
        setMessage(error.status === 429 ? "You’ve reached the submission limit. Please try again in " + Math.ceil(Number(error.retryAfter || 900) / 60) + " minutes. Your form is still here." : error.message);
      } else setMessage("We couldn’t submit your project. Your form is still here — please try again.");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    const form = new FormData(event.currentTarget);
    const parsed = projectSchema.safeParse(Object.fromEntries(form));
    setMessage("");
    setErrors({});
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])));
      return;
    }
    mutation.mutate(parsed.data);
  };

  return <div className="page-enter submission-page">
    <Link href="/dashboard/projects" className="back-link"><ArrowLeft size={15} />Back to your projects</Link>
    <div className="page-heading"><div><span className="section-kicker">MAKE A LITTLE ROOM FOR FEEDBACK</span><h1>Share what you’ve made<span className="text-primary">.</span></h1><p>Big idea or weekend experiment. This is a good place for it.</p></div></div>
    <div className="submission-grid">
      <section className="submission-panel"><div className="submission-panel-heading"><span className="dialog-icon"><FolderGit2 size={22} /></span><div><h2>The project details</h2><p>A little context goes a long way.</p></div><span className="required-note">All fields required</span></div>
        <form onSubmit={handleSubmit} noValidate className="submission-form">
          {message && <div className="error-banner" role="alert">{message}</div>}
          <div className="form-field"><label htmlFor="project-name">Project name</label><Input id="project-name" name="name" placeholder="Give your project a name" maxLength={150} disabled={mutation.isPending} aria-invalid={!!errors.name} aria-describedby={errors.name ? "project-name-error" : undefined} /><FormError id="project-name-error" message={errors.name} /></div>
          <div className="form-field"><label htmlFor="repo-url">Frontend repository URL<GitBranch size={14} /></label><Input id="repo-url" name="repoUrl" type="url" placeholder="https://github.com/you/your-project-frontend" maxLength={2048} disabled={mutation.isPending} aria-invalid={!!errors.repoUrl} aria-describedby={errors.repoUrl ? "repo-error" : "repo-hint"} /><p id="repo-hint" className="form-helper">GitHub, GitLab or Bitbucket. Use the repository root, and make sure your reviewer has access.</p><FormError id="repo-error" message={errors.repoUrl} /></div>
          <div className="form-field"><label htmlFor="backend-repo-url">Backend repository URL<GitBranch size={14} /></label><Input id="backend-repo-url" name="backendRepoUrl" type="url" placeholder="https://github.com/you/your-project-backend" maxLength={2048} disabled={mutation.isPending} aria-invalid={!!errors.backendRepoUrl} aria-describedby={errors.backendRepoUrl ? "backend-repo-error" : "repo-hint"} /><FormError id="backend-repo-error" message={errors.backendRepoUrl} /></div>
          <div className="form-field"><label htmlFor="live-link">Deployed live URL<Globe size={14} /></label><Input id="live-link" name="liveLink" type="url" placeholder="https://your-project.vercel.app" maxLength={2048} disabled={mutation.isPending} aria-invalid={!!errors.liveLink} aria-describedby={errors.liveLink ? "live-error" : undefined} /><FormError id="live-error" message={errors.liveLink} /></div>
          <div className="form-field"><label htmlFor="description">Tell us about it<FileText size={14} /></label><Textarea id="description" name="description" value={description} onChange={event => setDescription(event.target.value)} placeholder="What did you build? What problem does it solve? Share what you learned or what you’d love feedback on." maxLength={5000} className="submission-description" disabled={mutation.isPending} aria-invalid={!!errors.description} aria-describedby={errors.description ? "description-error" : "description-hint"} /><div className="textarea-footnote"><span id="description-hint">A minimum of 20 characters. A story, not an essay.</span><span>{description.length.toLocaleString()} / 5,000</span></div><FormError id="description-error" message={errors.description} /></div>
          <div className="submission-form-footer"><p><LockKeyhole size={14} />Shared with your mentors.</p><Button className="primary-button" type="submit" disabled={mutation.isPending}>{mutation.isPending ? <><LoaderCircle className="animate-spin" />Handing it in…</> : <>Hand in your project<ArrowRight size={16} /></>}</Button></div>
        </form>
      </section>
      <aside className="submission-aside">
        <div className="checklist-card"><span className="section-kicker">BEFORE YOU HIT SUBMIT</span><h3>Small details.<br /><em>Better first impressions.</em></h3><ul>{["Your repository is accessible to your mentor.", "Your live link opens and works.", "Your README explains how to get started.", "Your description tells a little of the story."].map(text => <li key={text}><span><Check size={13} /></span>{text}</li>)}</ul></div>
        <div className="tip-card"><Lightbulb size={21} strokeWidth={1.6} /><h4>Progress over polish.</h4><p>You don’t need to have every answer. Tell your mentor where you got stuck — that’s often where the best feedback starts.</p></div>
        <div className="submission-policy"><span className="pink-dot" />One project, two repositories.<p>You can share up to 5 submissions every 15 minutes. A little breathing room keeps the review queue thoughtful.</p></div>
      </aside>
    </div>
  </div>;
}