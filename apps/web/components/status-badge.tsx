import type { Submission } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: Submission["status"] }) {
  const styles = { PENDING: "border-amber-200 bg-amber-50 text-amber-700", APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700", REJECTED: "border-rose-200 bg-rose-50 text-rose-700" };
  return <Badge variant="outline" className={cn("capitalize", styles[status])}>{status.toLowerCase()}</Badge>;
}
