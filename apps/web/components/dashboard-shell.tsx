"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, PanelLeft } from "lucide-react";
import { api, type User } from "@/lib/api";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";

export function DashboardShell({ requiredRole, eyebrow, children }: { requiredRole: User["role"]; eyebrow: string; children: (user: User) => React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api<{ user: User }>("/auth/me").then(({ user }) => {
    if (user.role !== requiredRole) router.replace(user.role === "MENTOR" ? "/mentor" : "/student");
    else setUser(user);
  }).catch(() => router.replace(`/login?next=${encodeURIComponent(pathname)}`)).finally(() => setLoading(false)); }, [pathname, requiredRole, router]);
  const logout = async () => { await api("/auth/logout", { method: "POST" }).catch(() => undefined); router.replace("/login"); };
  if (loading || !user) return <div className="grid min-h-screen place-items-center"><div className="size-9 animate-spin rounded-full border-4 border-slate-200 border-t-primary" aria-label="Loading" /></div>;
  return <div className="min-h-screen"><header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5"><div className="flex items-center gap-6"><Logo/><span className="hidden border-l pl-6 text-xs font-bold uppercase tracking-[.16em] text-slate-400 sm:block">{eyebrow}</span></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div><Button variant="ghost" onClick={logout} aria-label="Sign out"><LogOut size={18}/><span className="ml-2 hidden sm:inline">Sign out</span></Button><PanelLeft className="hidden" /></div></div></header><main className="mx-auto max-w-7xl px-5 py-9">{children(user)}</main></div>;
}
