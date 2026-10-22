import Link from "next/link";
import { Layers2 } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand" aria-label="Hand-in home">
    <span className="brand-mark"><Layers2 size={21} strokeWidth={2} /></span>
    {!compact && <span className="brand-word">hand<span>-</span>in<span className="brand-period">.</span></span>}
  </Link>;
}
