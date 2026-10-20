"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Github, Send, TimerReset } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api, ApiError, type Submission } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form-field";
import { StatusBadge } from "@/components/status-badge";

const schema = z.object({
  projectName: z.string().trim().min(3, "Use at least 3 characters.").max(100),
  repoUrl: z.string().url("Enter a valid URL.").regex(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i, "Use a GitHub repository URL."),
  liveUrl: z.string().url("Enter a valid URL.").startsWith("https://", "The live URL must use HTTPS."),
  description: z.string().trim().min(30, "Tell your mentor a little more (30 characters minimum).").max(1500)
});
type Values = z.infer<typeof schema>;

export function StudentDashboard() {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
  useEffect(() => { api<{ submission: Submission | null }>("/submissions/mine").then(r => setSubmission(r.submission)).finally(() => setLoading(false)); }, []);
  const submit = async (values: Values) => {
    try { const result = await api<{ submission: Submission }>("/submissions", { method: "POST", body: JSON.stringify(values) }); setSubmission(result.submission); toast.success("Project submitted for review."); }
    catch (error) {
      if (error instanceof ApiError && error.errors) Object.entries(error.errors).forEach(([field, messages]) => setError(field as keyof Values, { message: messages?.[0] }));
      toast.error(error instanceof ApiError ? error.message : "Submission failed.");
    }
  };
  if (loading) return <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70"/>;
  return <><div className="mb-8"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Student workspace</p><h1 className="mt-2 font-[var(--font-heading)] text-3xl font-extrabold">{submission ? "Your submission" : "Submit your project"}</h1><p className="mt-2 text-slate-500">{submission ? "Track the review decision and mentor feedback here." : "Share one polished project for mentor review."}</p></div>
    {submission ? <Card className="overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-4 border-b p-6 sm:p-8"><div><div className="mb-3 flex items-center gap-3"><StatusBadge status={submission.status}/>{submission.status === "PENDING" && <span className="flex items-center gap-1 text-xs text-slate-500"><TimerReset size={14}/>Waiting for review</span>}</div><h2 className="font-[var(--font-heading)] text-2xl font-extrabold">{submission.projectName}</h2><p className="mt-2 text-sm text-slate-500">Submitted {new Date(submission.createdAt).toLocaleDateString()}</p></div><div className="flex gap-2"><a className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold" target="_blank" rel="noreferrer" href={submission.repoUrl}><Github size={17}/>Repository</a><a className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-white" target="_blank" rel="noreferrer" href={submission.liveUrl}><ExternalLink size={17}/>Live site</a></div></div><div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.5fr_1fr]"><div><h3 className="text-sm font-bold">Project overview</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{submission.description}</p></div><div><h3 className="text-sm font-bold">Mentor feedback</h3>{submission.feedback?.length ? <div className="mt-3 space-y-3">{submission.feedback.map(item => <div key={item.id} className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{item.message}</div>)}</div> : <p className="mt-3 rounded-xl border border-dashed p-4 text-sm text-slate-500">No feedback has been added yet.</p>}</div></div></Card>
    : <Card className="p-6 sm:p-8"><form className="grid gap-5" onSubmit={handleSubmit(submit)}><div className="grid gap-5 sm:grid-cols-2"><Field label="Project name" error={errors.projectName?.message}><Input placeholder="e.g. CourseFlow" {...register("projectName")}/></Field><Field label="GitHub repository" error={errors.repoUrl?.message}><Input type="url" placeholder="https://github.com/user/project" {...register("repoUrl")}/></Field></div><Field label="Live project URL" error={errors.liveUrl?.message}><Input type="url" placeholder="https://your-project.com" {...register("liveUrl")}/></Field><Field label="Description" error={errors.description?.message}><Textarea rows={6} placeholder="What problem does your project solve? Mention the key features and technical choices." {...register("description")}/></Field><div className="flex flex-col-reverse items-start justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center"><p className="max-w-lg text-xs leading-5 text-slate-500">You can submit one project. Double-check every link before sending it for review.</p><Button disabled={isSubmitting} className="gap-2"><Send size={16}/>{isSubmitting ? "Submitting…" : "Submit project"}</Button></div></form></Card>}</>;
}
