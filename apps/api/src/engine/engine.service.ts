import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role, SessionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import type { AuthUser } from "../common/auth";

@Injectable()
export class EngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async studentExams(studentId: string) {
    return this.prisma.examAssignment.findMany({
      where: { studentId, exam: { status: "PUBLISHED" } },
      include: {
        exam: {
          include: {
            runs: { orderBy: { startedAt: "desc" }, take: 1 },
            warningPolicy: true,
          },
        },
      },
    });
  }

  async getOrCreateSession(examId: string, studentId: string) {
    const assignment = await this.prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId, studentId } },
    });
    if (!assignment) throw new ForbiddenException("You are not assigned to this exam");
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      include: { runs: { orderBy: { startedAt: "desc" }, take: 1 } },
    });
    const run = exam.runs[0];
    if (!run) throw new BadRequestException("Exam run is not ready");
    return this.prisma.examSession.upsert({
      where: { examRunId_studentId: { examRunId: run.id, studentId } },
      create: { examRunId: run.id, studentId, status: SessionStatus.PENDING },
      update: {},
      include: { examRun: { include: { exam: true } }, warnings: true, consent: true },
    });
  }

  async markReady(sessionId: string, studentId: string) {
    const session = await this.requireOwner(sessionId, studentId);
    return this.prisma.examSession.update({
      where: { id: session.id },
      data: { readinessOk: true, status: SessionStatus.READY },
    });
  }

  async consent(sessionId: string, studentId: string, policyText: string) {
    const session = await this.requireOwner(sessionId, studentId);
    await this.prisma.proctoringConsent.upsert({
      where: { sessionId: session.id },
      create: { sessionId: session.id, policyText },
      update: { policyText, acceptedAt: new Date() },
    });
    return this.prisma.examSession.update({
      where: { id: session.id },
      data: { consentAt: new Date() },
    });
  }

  async staffStart(examId: string, actor: AuthUser) {
    if (actor.role === Role.STAFF) {
      const assigned = await this.prisma.staffExamAssignment.findFirst({
        where: { examId, staffProfile: { userId: actor.id } },
      });
      if (!assigned) throw new ForbiddenException("Not assigned to this exam");
    }
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      include: { assignments: true, runs: { orderBy: { startedAt: "desc" }, take: 1 } },
    });
    if (exam.status !== "PUBLISHED") throw new BadRequestException("Exam is not published");
    const run = exam.runs[0];
    const startedAt = run.startedAt ?? new Date();
    const deadline = new Date(startedAt.getTime() + exam.durationMinutes * 60_000);

    const updatedRun = await this.prisma.examRun.update({
      where: { id: run.id },
      data: { status: "LIVE", startedAt, startedById: actor.id },
    });

    await this.prisma.$transaction(
      exam.assignments.map((a) =>
        this.prisma.examSession.upsert({
          where: { examRunId_studentId: { examRunId: run.id, studentId: a.studentId } },
          create: {
            examRunId: run.id,
            studentId: a.studentId,
            status: SessionStatus.READY,
            serverDeadlineAt: deadline,
          },
          update: {
            serverDeadlineAt: deadline,
          },
        }),
      ),
    );

    await this.audit.record({
      actorId: actor.id,
      action: "EXAM_START",
      entity: "ExamRun",
      entityId: run.id,
    });
    this.realtime.sessionUpdated(examId, { examId, status: "LIVE", startedAt });
    return updatedRun;
  }

  async beginAttempt(sessionId: string, studentId: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        examRun: { include: { exam: { include: { sections: { include: { questions: { include: { question: { include: { options: true } } } } } } } } } },
        questionOrder: true,
      },
    });
    if (!session || session.studentId !== studentId) throw new ForbiddenException();
    if (!session.examRun.startedAt) throw new BadRequestException("Staff have not started this exam");
    if (!session.consentAt) throw new BadRequestException("Consent is required");
    if (!session.readinessOk) throw new BadRequestException("Readiness checks are incomplete");
    if (session.status === SessionStatus.SUBMITTED || session.status === SessionStatus.TIMED_OUT) {
      throw new BadRequestException("This attempt is already closed");
    }

    const now = new Date();
    if (session.serverDeadlineAt && now > session.serverDeadlineAt) {
      return this.finalize(session.id, "TIMEOUT");
    }

    if (session.questionOrder.length === 0) {
      const questions = session.examRun.exam.sections.flatMap((s) => s.questions);
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      await this.prisma.sessionQuestionOrder.createMany({
        data: shuffled.map((q, order) => ({
          sessionId: session.id,
          questionId: q.questionId,
          order,
        })),
      });
    }

    const live = await this.prisma.examSession.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.IN_PROGRESS,
        startedAt: session.startedAt ?? now,
      },
      include: {
        examRun: { include: { exam: true } },
        questionOrder: true,
        answers: true,
        warnings: true,
      },
    });

    const optionSafe = await this.prisma.question.findMany({
      where: { id: { in: live.questionOrder.map((q) => q.questionId) } },
      include: { options: true },
    });

    return {
      session: {
        id: live.id,
        status: live.status,
        serverDeadlineAt: live.serverDeadlineAt,
        warningCount: live.warningCount,
        examTitle: live.examRun.exam.title,
      },
      questions: live.questionOrder
        .sort((a, b) => a.order - b.order)
        .map((order) => {
          const q = optionSafe.find((item) => item.id === order.questionId)!;
          return {
            id: q.id,
            type: q.type,
            stem: q.stem,
            marks: q.marks,
            options: q.options.map((o) => ({ id: o.id, label: o.label, text: o.text })),
            answer: live.answers.find((a) => a.questionId === q.id)?.payload ?? null,
          };
        }),
    };
  }

  async saveAnswer(sessionId: string, studentId: string, questionId: string, payload: unknown) {
    const session = await this.requireOwner(sessionId, studentId);
    this.assertWritable(session);
    return this.prisma.studentAnswer.upsert({
      where: { sessionId_questionId: { sessionId, questionId } },
      create: { sessionId, questionId, payload: payload as Prisma.InputJsonValue },
      update: { payload: payload as Prisma.InputJsonValue },
    });
  }

  async submit(sessionId: string, studentId: string, reason = "STUDENT") {
    const session = await this.requireOwner(sessionId, studentId);
    if (session.status === SessionStatus.SUBMITTED) return this.prisma.submission.findUnique({ where: { sessionId } });
    this.assertWritable(session);

    // Rule 2 & 5: Backend Enforcement - Prevent submission before minimum duration
    if (reason === "STUDENT" && session.startedAt) {
      const fullSession = await this.prisma.examSession.findUnique({
        where: { id: sessionId },
        include: { examRun: { include: { exam: true } } },
      });
      const minDurationMinutes = (fullSession?.examRun.exam.frozenConfig as any)?.minDurationMinutes ?? 30;
      const minCompletionAt = session.startedAt.getTime() + minDurationMinutes * 60_000;
      if (Date.now() < minCompletionAt) {
        throw new BadRequestException(
          `Submission rejected: Institutional policy requires a minimum examination duration of ${minDurationMinutes} minutes before submission. Please continue reviewing your answers.`
        );
      }
    }

    return this.finalize(sessionId, reason);
  }

  async scoreSession(sessionId: string) {
    const session = await this.prisma.examSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { answers: true, examRun: { include: { exam: { include: { sections: { include: { questions: { include: { question: { include: { options: true } } } } } } } } } } },
    });
    let objective = 0;
    let maxTotal = 0;
    for (const section of session.examRun.exam.sections) {
      for (const sq of section.questions) {
        const marks = Number(sq.marks);
        maxTotal += marks;
        const answer = session.answers.find((a) => a.questionId === sq.questionId);
        const q = sq.question;
        if (q.type === "SINGLE_MCQ") {
          const selected = (answer?.payload as { optionId?: string } | null)?.optionId;
          const correct = q.options.find((o) => o.isCorrect);
          if (selected && correct && selected === correct.id) objective += marks;
          else if (selected) objective -= Number(q.negativeMarks);
        }
      }
    }
    const total = Math.max(0, objective);
    return this.prisma.score.upsert({
      where: { sessionId },
      create: { sessionId, objective, coding: 0, total, maxTotal },
      update: { objective, total, maxTotal, scoredAt: new Date() },
    });
  }

  lobby(examId: string) {
    return this.prisma.examSession.findMany({
      where: { examRun: { examId } },
      include: {
        warnings: true,
        incidents: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  private async finalize(sessionId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.submission.findUnique({ where: { sessionId } });
      if (existing) return existing;
      await tx.studentAnswer.updateMany({ where: { sessionId }, data: { frozen: true } });
      const submission = await tx.submission.create({
        data: { sessionId, reason },
      });
      await tx.examSession.update({
        where: { id: sessionId },
        data: {
          status: reason === "TIMEOUT" ? SessionStatus.TIMED_OUT : SessionStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });
      await tx.result.create({ data: { sessionId } });
      return submission;
    }).then(async (submission) => {
      await this.scoreSession(sessionId);
      return submission;
    });
  }

  private async requireOwner(sessionId: string, studentId: string) {
    const session = await this.prisma.examSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException("Session not found");
    if (session.studentId !== studentId) throw new ForbiddenException();
    return session;
  }

  private assertWritable(session: { status: SessionStatus; serverDeadlineAt: Date | null }) {
    if (session.status === SessionStatus.SUBMITTED || session.status === SessionStatus.TIMED_OUT) {
      throw new BadRequestException("Answers are frozen");
    }
    if (session.serverDeadlineAt && new Date() > session.serverDeadlineAt) {
      throw new BadRequestException("Server deadline has passed");
    }
  }
}
