import { Router } from "express";
import { Role, SubmissionStatus } from "@prisma/client";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";

export const submissionRouter = Router();
submissionRouter.use(authenticate);

const submissionSchema = z.object({
  projectName: z.string().trim().min(3).max(100),
  repoUrl: z.string().trim().url().refine(v => /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i.test(v), "Enter a valid GitHub repository URL."),
  liveUrl: z.string().trim().url().refine(v => v.startsWith("https://"), "Live URL must use HTTPS."),
  description: z.string().trim().min(30).max(1500)
});

submissionRouter.post("/", authorize(Role.STUDENT), async (req, res) => {
  const data = submissionSchema.parse(req.body);
  const current = await prisma.submission.findUnique({ where: { studentId: req.user!.id }, select: { id: true } });
  if (current) throw new AppError(409, "You have already submitted a project.");
  const submission = await prisma.submission.create({ data: { ...data, studentId: req.user!.id } });
  res.status(201).json({ submission });
});

submissionRouter.get("/mine", authorize(Role.STUDENT), async (req, res) => {
  const submission = await prisma.submission.findUnique({
    where: { studentId: req.user!.id },
    include: { feedback: { orderBy: { createdAt: "desc" }, select: { id: true, message: true, createdAt: true } } }
  });
  res.json({ submission });
});

submissionRouter.patch("/mine", authorize(Role.STUDENT), async (req, res) => {
  const data = submissionSchema.parse(req.body);
  const current = await prisma.submission.findUnique({ where: { studentId: req.user!.id }, select: { id: true, status: true } });
  if (!current) throw new AppError(404, "You have not submitted a project yet.");
  if (current.status !== SubmissionStatus.PENDING) throw new AppError(409, "Reviewed submissions can no longer be edited.");
  const submission = await prisma.submission.update({ where: { id: current.id }, data });
  res.json({ submission });
});

submissionRouter.delete("/mine", authorize(Role.STUDENT), async (req, res) => {
  const current = await prisma.submission.findUnique({ where: { studentId: req.user!.id }, select: { id: true, status: true } });
  if (!current) throw new AppError(404, "You have not submitted a project yet.");
  if (current.status !== SubmissionStatus.PENDING) throw new AppError(409, "Reviewed submissions cannot be withdrawn.");
  await prisma.submission.delete({ where: { id: current.id } });
  res.status(204).send();
});

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.nativeEnum(SubmissionStatus).optional()
});

submissionRouter.get("/", authorize(Role.MENTOR), async (req, res) => {
  const { page, limit, status } = listSchema.parse(req.query);
  const where = status ? { status } : {};
  const [items, total] = await prisma.$transaction([
    prisma.submission.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, name: true, email: true } } }
    }),
    prisma.submission.count({ where })
  ]);
  res.json({ items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

submissionRouter.get("/stats", authorize(Role.MENTOR), async (_req, res) => {
  const grouped = await prisma.submission.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = Object.fromEntries(grouped.map(row => [row.status, row._count._all]));
  res.json({
    stats: {
      total: grouped.reduce((sum, row) => sum + row._count._all, 0),
      pending: counts.PENDING ?? 0,
      approved: counts.APPROVED ?? 0,
      rejected: counts.REJECTED ?? 0
    }
  });
});

const reviewSchema = z.object({ status: z.enum([SubmissionStatus.APPROVED, SubmissionStatus.REJECTED]), feedback: z.string().trim().max(1000).optional() });
submissionRouter.patch("/:id/status", authorize(Role.MENTOR), async (req, res) => {
  const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
  const data = reviewSchema.parse(req.body);
  const exists = await prisma.submission.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new AppError(404, "Submission not found.");
  const submission = await prisma.$transaction(async tx => {
    const updated = await tx.submission.update({ where: { id }, data: { status: data.status, reviewerId: req.user!.id, reviewedAt: new Date() } });
    if (data.feedback) await tx.feedback.create({ data: { message: data.feedback, submissionId: id, authorId: req.user!.id } });
    return updated;
  });
  res.json({ submission });
});
