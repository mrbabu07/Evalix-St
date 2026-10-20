"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { ArrowDownAZ, Check, ChevronLeft, ChevronRight, ExternalLink, Eye, Github, Inbox, Search, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, type Submission } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";

type Filter = "ALL" | Submission["status"];
type SortBy = "createdAt" | "projectName" | "status";
type ListResponse = { items: Submission[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type Stats = { total: number; pending: number; approved: number; rejected: number };

export function MentorDashboard() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [data, setData] = useState<ListResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, order });
      if (filter !== "ALL") query.set("status", filter);
      if (deferredSearch.trim()) query.set("search", deferredSearch.trim());
      const [list, totals] = await Promise.all([api<ListResponse>(`/submissions?${query}`), api<{ stats: Stats }>("/submissions/stats")]);
      setData(list);
      setStats(totals.stats);
    } catch { toast.error("Could not load the review queue."); }
    finally { setLoading(false); }
  }, [deferredSearch, filter, limit, order, page, sortBy]);

  // The request is the external synchronization; state updates occur after it resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const changeQuery = (change: () => void) => { setLoading(true); change(); };
  const openDetails = (item: Submission) => { setSelected(item); setDecision(null); setFeedback(""); };
  const closeDetails = () => { if (!working) { setSelected(null); setDecision(null); setFeedback(""); } };

  const review = async () => {
    if (!selected || !decision) return;
    if (decision === "REJECTED" && !feedback.trim()) { toast.error("Explain what the student should improve before rejecting."); return; }
    setWorking(true);
    try {
      await api(`/submissions/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: decision, feedback: feedback.trim() || undefined }) });
      toast.success(`Project ${decision.toLowerCase()}.`);
      closeDetails();
      setSelected(null);
      await load();
    } catch (error) { toast.error(error instanceof ApiError ? error.message : "Review action failed."); }
    finally { setWorking(false); }
  };

  const cards = [["Total", stats?.total ?? 0, "text-slate-900"], ["Pending", stats?.pending ?? 0, "text-amber-600"], ["Approved", stats?.approved ?? 0, "text-emerald-600"], ["Rejected", stats?.rejected ?? 0, "text-rose-600"]];

  return <>
    <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Mentor workspace</p><h1 className="mt-2 font-[var(--font-heading)] text-3xl font-extrabold">Review dashboard</h1><p className="mt-2 text-slate-500">Review submissions and keep decisions moving.</p></div>
    <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, color]) => <Card key={String(label)} className="p-5"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-3xl font-extrabold ${color}`}>{value}</p></Card>)}</section>

    <Card className="mb-5 p-4 shadow-none"><div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><Input className="pl-9" value={search} onChange={event => changeQuery(() => { setSearch(event.target.value); setPage(1); })} placeholder="Search project, student, or email…" /><span className="sr-only">Search submissions</span></label><select aria-label="Sort submissions" value={sortBy} onChange={event => changeQuery(() => { setSortBy(event.target.value as SortBy); setPage(1); })} className="h-11 rounded-lg border bg-white px-3 text-sm font-semibold"><option value="createdAt">Sort by date</option><option value="projectName">Sort by project</option><option value="status">Sort by status</option></select><Button variant="outline" onClick={() => changeQuery(() => setOrder(value => value === "desc" ? "asc" : "desc"))}><ArrowDownAZ size={17} />{order === "desc" ? "Descending" : "Ascending"}</Button></div><div className="mt-3 flex flex-wrap gap-2">{(["ALL", "PENDING", "APPROVED", "REJECTED"] as Filter[]).map(value => <button key={value} onClick={() => changeQuery(() => { setFilter(value); setPage(1); })} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${filter === value ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>{value.toLowerCase()}</button>)}</div></Card>

    <Card className="overflow-hidden">
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left"><thead className="border-b bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Project</th><th className="px-5 py-4">Student</th><th className="px-5 py-4">Submitted</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Review</th></tr></thead><tbody className="divide-y">{loading ? Array.from({ length: 4 }).map((_, index) => <tr key={index}><td colSpan={5} className="px-5 py-4"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></td></tr>) : data?.items.length ? data.items.map(item => <tr key={item.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><p className="font-bold">{item.projectName}</p><div className="mt-1 flex gap-3"><a className="inline-flex items-center gap-1 text-xs text-primary hover:underline" href={item.repoUrl} target="_blank" rel="noreferrer"><Github size={13} />Repo</a><a className="inline-flex items-center gap-1 text-xs text-primary hover:underline" href={item.liveUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} />Live</a></div></td><td className="px-5 py-4"><p className="text-sm font-semibold">{item.student?.name}</p><p className="text-xs text-slate-500">{item.student?.email}</p></td><td className="px-5 py-4 text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td><td className="px-5 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4 text-right"><Button variant="outline" onClick={() => openDetails(item)}><Eye size={16} />Details</Button></td></tr>) : <EmptyRow />}</tbody></table></div>
      <div className="divide-y md:hidden">{loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="m-4 h-28 animate-pulse rounded-xl bg-slate-100" />) : data?.items.length ? data.items.map(item => <article key={item.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{item.projectName}</h2><p className="mt-1 text-xs text-slate-500">{item.student?.name} · {new Date(item.createdAt).toLocaleDateString()}</p></div><StatusBadge status={item.status} /></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p><Button className="mt-4 w-full" variant="outline" onClick={() => openDetails(item)}><Eye size={16} />Review details</Button></article>) : <div className="px-5 py-14 text-center"><Inbox className="mx-auto text-slate-300" size={38} /><p className="mt-3 font-semibold">No submissions found</p></div>}</div>
      {data && <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4"><div className="flex items-center gap-3"><p className="text-sm text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} results</p><select aria-label="Rows per page" value={limit} onChange={event => changeQuery(() => { setLimit(Number(event.target.value)); setPage(1); })} className="h-9 rounded-lg border bg-white px-2 text-xs font-semibold"><option value="5">5 rows</option><option value="8">8 rows</option><option value="15">15 rows</option></select></div><div className="flex gap-2"><Button size="icon" variant="outline" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => changeQuery(() => setPage(value => value - 1))}><ChevronLeft size={17} /></Button><Button size="icon" variant="outline" aria-label="Next page" disabled={page >= data.pagination.totalPages || loading} onClick={() => changeQuery(() => setPage(value => value + 1))}><ChevronRight size={17} /></Button></div></div>}
    </Card>

    <Dialog open={Boolean(selected)} onOpenChange={open => !open && closeDetails()}><DialogContent><DialogHeader><div className="flex items-center gap-3">{selected && <StatusBadge status={selected.status} />}<span className="text-xs font-semibold text-slate-400">{selected && new Date(selected.createdAt).toLocaleDateString()}</span></div><DialogTitle>{selected?.projectName}</DialogTitle><DialogDescription>Submitted by {selected?.student?.name} ({selected?.student?.email})</DialogDescription></DialogHeader>{selected && <div className="mt-6 grid gap-6"><div><h3 className="text-sm font-bold">Project description</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{selected.description}</p><div className="mt-4 flex gap-2"><Button asChild variant="outline"><a href={selected.repoUrl} target="_blank" rel="noreferrer"><Github size={16} />Repository</a></Button><Button asChild variant="outline"><a href={selected.liveUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} />Live site</a></Button></div></div>{selected.reviewer && <div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-bold">Review history</p><p className="mt-1 text-slate-600">Reviewed by {selected.reviewer.name}{selected.reviewedAt ? ` on ${new Date(selected.reviewedAt).toLocaleString()}` : ""}.</p>{selected.feedback?.map(item => <blockquote key={item.id} className="mt-3 border-l-2 border-primary pl-3 text-slate-600">{item.message}<footer className="mt-1 text-xs text-slate-400">{item.author?.name ?? "Mentor"}</footer></blockquote>)}</div>}{decision && <div className={`rounded-xl border p-4 ${decision === "APPROVED" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}><p className="font-bold">Confirm {decision.toLowerCase()}</p><p className="mt-1 text-sm text-slate-600">{decision === "APPROVED" ? "This project will be marked approved." : "The student will see your explanation and can use it to improve."}</p><Textarea className="mt-4 bg-white" rows={4} value={feedback} onChange={event => setFeedback(event.target.value)} placeholder={decision === "REJECTED" ? "Required: explain what needs improvement…" : "Optional feedback for the student…"} /><p className="mt-1 text-right text-xs text-slate-400">{feedback.length}/1000</p></div>}</div>}<DialogFooter>{decision ? <><Button variant="outline" disabled={working} onClick={() => setDecision(null)}>Back</Button><Button variant={decision === "REJECTED" ? "destructive" : "default"} disabled={working || feedback.length > 1000} onClick={review}>{working ? "Saving…" : `Confirm ${decision.toLowerCase()}`}</Button></> : <><Button variant="outline" onClick={() => setDecision("REJECTED")}><X size={16} />Reject</Button><Button onClick={() => setDecision("APPROVED")}><Check size={16} />Approve</Button></>}</DialogFooter></DialogContent></Dialog>
  </>;
}

function EmptyRow() {
  return <tr><td colSpan={5} className="px-5 py-16 text-center"><Inbox className="mx-auto text-slate-300" size={38} /><p className="mt-3 font-semibold">No submissions found</p><p className="mt-1 text-sm text-slate-500">Try another filter or search.</p></td></tr>;
}
