"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Github, Pencil, RotateCcw, Send, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api, ApiError, type Submission, type User } from "@/lib/api";
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
const emptyValues: Values = { projectName: "", repoUrl: "", liveUrl: "", description: "" };

function hostname(value: string) {
  try { return new URL(value).hostname; } catch { return null; }
}

export function StudentDashboard({ user }: { user: User }) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const { register, handleSubmit, setError, reset, control, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: emptyValues });
  const [description, repoUrl, liveUrl] = useWatch({ control, name: ["description", "repoUrl", "liveUrl"] });

  useEffect(() => {
    api<{ submission: Submission | null }>("/submissions/mine")
      .then(result => setSubmission(result.submission))
      .catch(() => toast.error("Could not load your submission."))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (values: Values) => {
    try {
      const result = await api<{ submission: Submission }>("/submissions" + (editing ? "/mine" : ""), { method: editing ? "PATCH" : "POST", body: JSON.stringify(values) });
      setSubmission(current => ({ ...current, ...result.submission }));
      setEditing(false);
      toast.success(editing ? "Submission updated." : "Project submitted for review.");
    } catch (error) {
      if (error instanceof ApiError && error.errors) Object.entries(error.errors).forEach(([field, messages]) => setError(field as keyof Values, { message: messages?.[0] }));
      toast.error(error instanceof ApiError ? error.message : "Submission failed.");
    }
  };

  const startEditing = () => {
    if (!submission) return;
    reset({ projectName: submission.projectName, repoUrl: submission.repoUrl, liveUrl: submission.liveUrl, description: submission.description });
    setEditing(true);
  };

  const withdraw = async () => {
    if (!window.confirm("Withdraw this submission? You can submit a new project afterward.")) return;
    setWithdrawing(true);
    try {
      await api("/submissions/mine", { method: "DELETE" });
      setSubmission(null);
      setEditing(false);
      reset(emptyValues);
      toast.success("Submission withdrawn. You can submit again when ready.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not withdraw the submission.");
    } finally { setWithdrawing(false); }
  };

  if (loading) return <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />;
  const showForm = !submission || editing;

  return <>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Student workspace</p><h1 className="mt-2 font-[var(--font-heading)] text-3xl font-extrabold">{editing ? "Edit your submission" : submission ? "Your submission" : "Submit your project"}</h1><p className="mt-2 text-slate-500">{showForm ? "Share one polished project for mentor review." : "Track the review decision and mentor feedback here."}</p></div>
      <Card className="flex min-w-64 items-center gap-3 p-4 shadow-none"><div className="grid size-10 place-items-center rounded-full bg-blue-50 font-bold text-primary">{user.name.charAt(0).toUpperCase()}</div><div><p className="text-sm font-bold">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div></Card>
    </div>

    {showForm ? <Card className="p-6 sm:p-8"><form className="grid gap-5" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-5 sm:grid-cols-2"><Field label="Project name" error={errors.projectName?.message}><Input placeholder="e.g. CourseFlow" {...register("projectName")} /></Field><Field label="GitHub repository" error={errors.repoUrl?.message}><Input type="url" placeholder="https://github.com/user/project" {...register("repoUrl")} /></Field></div>
      <Field label="Live project URL" error={errors.liveUrl?.message}><Input type="url" placeholder="https://your-project.com" {...register("liveUrl")} /></Field>
      {(hostname(repoUrl) || hostname(liveUrl)) && <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Repository preview</p><p className="mt-1 font-semibold text-slate-700">{hostname(repoUrl) ?? "Waiting for a valid URL"}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Live-site preview</p><p className="mt-1 font-semibold text-slate-700">{hostname(liveUrl) ?? "Waiting for a valid URL"}</p></div></div>}
      <Field label="Description" error={errors.description?.message}><Textarea rows={6} placeholder="What problem does your project solve? Mention the key features and technical choices." {...register("description")} /><span className={`text-right text-xs ${description.length > 1500 ? "text-rose-600" : "text-slate-400"}`}>{description.length}/1500</span></Field>
      <div className="flex flex-col-reverse items-start justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center"><p className="max-w-lg text-xs leading-5 text-slate-500">{editing ? "Only pending submissions can be changed." : "You can submit one project. Double-check every link before sending it for review."}</p><div className="flex gap-2">{editing && <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>}<Button disabled={isSubmitting}><Send size={16} />{isSubmitting ? "Saving…" : editing ? "Save changes" : "Submit project"}</Button></div></div>
    </form></Card> : submission && <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b p-6 sm:p-8"><div><StatusBadge status={submission.status} /><h2 className="mt-3 font-[var(--font-heading)] text-2xl font-extrabold">{submission.projectName}</h2><p className="mt-2 text-sm text-slate-500">Submitted {new Date(submission.createdAt).toLocaleDateString()}</p></div><div className="flex flex-wrap gap-2"><a className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold" target="_blank" rel="noreferrer" href={submission.repoUrl}><Github size={17} />Repository</a><a className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-white" target="_blank" rel="noreferrer" href={submission.liveUrl}><ExternalLink size={17} />Live site</a></div></div>
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_.65fr]"><div><h3 className="text-sm font-bold">Project overview</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{submission.description}</p><h3 className="mt-8 text-sm font-bold">Mentor feedback</h3>{submission.feedback?.length ? <div className="mt-3 space-y-3">{submission.feedback.map(item => <div key={item.id} className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{item.message}</div>)}</div> : <p className="mt-3 rounded-xl border border-dashed p-4 text-sm text-slate-500">No feedback has been added yet.</p>}</div>
        <div><h3 className="text-sm font-bold">Review timeline</h3><ol className="mt-4 space-y-1"><li className="relative border-l-2 border-primary pb-7 pl-5"><span className="absolute -left-[7px] top-0 size-3 rounded-full bg-primary" /><p className="text-sm font-semibold">Project submitted</p><p className="mt-1 text-xs text-slate-500">{new Date(submission.createdAt).toLocaleString()}</p></li><li className={`relative border-l-2 pl-5 ${submission.reviewedAt ? "border-primary" : "border-slate-200"}`}><span className={`absolute -left-[7px] top-0 size-3 rounded-full ${submission.reviewedAt ? "bg-primary" : "bg-slate-200"}`} /><p className="text-sm font-semibold">{submission.reviewedAt ? `Project ${submission.status.toLowerCase()}` : "Mentor review"}</p><p className="mt-1 text-xs text-slate-500">{submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleString() : "Waiting for a decision"}</p></li></ol>{submission.status === "PENDING" && <div className="mt-8 grid gap-2"><Button variant="outline" onClick={startEditing}><Pencil size={16} />Edit submission</Button><Button variant="ghost" className="text-rose-600 hover:bg-rose-50" disabled={withdrawing} onClick={withdraw}>{withdrawing ? <RotateCcw className="animate-spin" size={16} /> : <Trash2 size={16} />}{withdrawing ? "Withdrawing…" : "Withdraw & resubmit"}</Button></div>}</div>
      </div>
    </Card>}
  </>;
}
