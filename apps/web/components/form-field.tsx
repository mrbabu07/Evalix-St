import { Label } from "@/components/ui/label";

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}{error && <span className="text-xs text-rose-600">{error}</span>}</div>;
}
