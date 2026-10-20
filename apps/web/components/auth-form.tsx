"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api, ApiError, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form-field";

const schema = z.object({ name: z.string().trim().min(2, "Use at least 2 characters.").optional(), email: z.string().email("Enter a valid email."), password: z.string().min(8, "Password must be at least 8 characters.") });
type Values = z.infer<typeof schema>;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
  const submit = async (values: Values) => {
    setServerError("");
    try {
      const { user } = await api<{ user: User }>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(values) });
      toast.success(mode === "signup" ? "Your account is ready." : `Welcome back, ${user.name}.`);
      router.replace(user.role === "MENTOR" ? "/mentor" : "/student");
    } catch (error) { setServerError(error instanceof ApiError ? error.message : "Could not connect to the server."); }
  };
  return <form onSubmit={handleSubmit(submit)} className="grid gap-4">
    {mode === "signup" && <Field label="Full name" error={errors.name?.message}><Input placeholder="Samira Rahman" autoComplete="name" {...register("name")} /></Field>}
    <Field label="Email address" error={errors.email?.message}><Input type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} /></Field>
    <Field label="Password" error={errors.password?.message}><Input type="password" placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} /></Field>
    {serverError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{serverError}</p>}
    <Button disabled={isSubmitting}>{isSubmitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create student account"}</Button>
    <p className="text-center text-sm text-slate-500">{mode === "login" ? "New student?" : "Already registered?"} <Link className="font-semibold text-primary hover:underline" href={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Create an account" : "Sign in"}</Link></p>
  </form>;
}
