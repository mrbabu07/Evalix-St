"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay data-slot="dialog-overlay" className={cn("fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in", className)} {...props} />;
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return <DialogPortal><DialogOverlay /><DialogPrimitive.Content data-slot="dialog-content" className={cn("fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-2xl", className)} {...props}>{children}<DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={18} /><span className="sr-only">Close</span></DialogPrimitive.Close></DialogPrimitive.Content></DialogPortal>;
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("grid gap-2 pr-8", className)} {...props} />; }
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end", className)} {...props} />; }
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) { return <DialogPrimitive.Title className={cn("font-[var(--font-heading)] text-xl font-extrabold", className)} {...props} />; }
function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) { return <DialogPrimitive.Description className={cn("text-sm text-slate-500", className)} {...props} />; }

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
