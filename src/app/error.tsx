"use client";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="simple-state"><Brand /><span className="empty-state-icon"><AlertCircle size={28} /></span><h1>A small bump in the road.</h1><p>We couldn’t load this page. Give it another try — your work will be waiting.</p><Button className="primary-button" onClick={reset}><RefreshCw size={16} />Try again</Button><Link href="/login" className="text-action">Back to sign in<ArrowRight size={15} /></Link></main>;
}