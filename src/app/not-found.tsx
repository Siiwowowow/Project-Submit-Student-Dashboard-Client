import Link from "next/link";
import { ArrowLeft, FolderSearch } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="simple-state"><Brand /><span className="empty-state-icon"><FolderSearch size={28} /></span><h1>A little off the beaten path.</h1><p>This page doesn’t exist. Let’s get you back to your workspace.</p><Button asChild className="primary-button"><Link href="/dashboard"><ArrowLeft size={16} />Back to your workspace</Link></Button></main>;
}