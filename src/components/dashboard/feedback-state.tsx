import { AlertCircle, FolderOpen, LoaderCircle, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LoadingState() {
  return <div className="table-state" role="status"><LoaderCircle className="animate-spin text-primary" size={25} /><h3>Gathering your projects…</h3><p>Just a moment. We’re getting everything ready.</p></div>;
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="table-state"><span className="empty-state-icon error-state-icon"><AlertCircle size={24} /></span><h3>Couldn’t load the projects.</h3><p>Your work is safe. Let’s give that another try.</p><Button variant="outline" className="h-10 px-4" onClick={onRetry}><RefreshCw size={15} />Try again</Button></div>;
}

export function EmptyState({ reviewer, filtered }: { reviewer: boolean; filtered: boolean }) {
  return <div className="table-state"><span className="empty-state-icon"><FolderOpen size={28} strokeWidth={1.5} /></span><h3>{filtered ? "Nothing here just yet." : reviewer ? "A quiet desk, for now." : "Your first project belongs here."}</h3><p>{filtered ? "Projects with this status will appear here." : reviewer ? "New student submissions will appear here, ready for your feedback." : "That thing you’ve been working on? We’d love to see it."}</p>{!reviewer && !filtered && <Button asChild className="primary-button"><Link href="/dashboard/new"><Plus size={16} />Submit your first project</Link></Button>}</div>;
}