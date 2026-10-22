import { Check, Clock3, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/types/project.types";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const labels = { PENDING: "Pending review", APPROVED: "Approved", REJECTED: "Rejected" };
  const Icon = status === "APPROVED" ? Check : status === "REJECTED" ? X : Clock3;
  return <Badge variant="outline" className={"status-badge status-" + status.toLowerCase()}><Icon size={12} />{labels[status]}</Badge>;
}