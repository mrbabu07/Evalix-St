import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn("min-h-24 w-full rounded-lg border bg-white px-3 py-3 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
}

export { Textarea };
