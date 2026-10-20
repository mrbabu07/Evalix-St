"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { StudentDashboard } from "@/components/student-dashboard";
export default function StudentPage() { return <DashboardShell requiredRole="STUDENT" eyebrow="Student portal">{user => <StudentDashboard user={user}/>}</DashboardShell>; }
