import { Injectable, ForbiddenException, BadRequestException } from "@nestjs/common";
import { SessionStatus, WarningSequence, UserStatus } from "@prisma/client";
import { TECHNICAL_EVENTS, type ProctoringEventType } from "@kgs/shared";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { AuditService } from "../audit/audit.service";

const SEQUENCE: WarningSequence[] = [
  WarningSequence.FIRST,
  WarningSequence.SECOND,
  WarningSequence.THIRD,
];

@Injectable()
export class ProctoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly audit: AuditService,
  ) {}

  async ingest(
    sessionId: string,
    studentId: string,
    input: { type: ProctoringEventType; confidence?: number; detectorVersion?: string },
  ) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        examRun: { include: { exam: { include: { warningPolicy: true } } } },
        warnings: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!session || session.studentId !== studentId) throw new ForbiddenException();
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException("Proctoring is only active during the attempt");
    }

    const technical = TECHNICAL_EVENTS.has(input.type);
    const policy = session.examRun.exam.warningPolicy;
    const now = Date.now();

    const recent = await this.prisma.proctoringEvent.findFirst({
      where: {
        sessionId,
        type: input.type,
        createdAt: {
          gte: new Date(now - (policy?.groupWindowSeconds ?? 8) * 1000),
        },
      },
    });

    const event = await this.prisma.proctoringEvent.create({
      data: {
        sessionId,
        type: input.type,
        confidence: input.confidence,
        detectorVersion: input.detectorVersion ?? "client-1",
        grouped: Boolean(recent),
        technical,
      },
    });

    if (technical || recent) {
      return { event, warning: null, warningCount: session.warningCount };
    }

    const lastWarning = session.warnings[0];
    const cooldownMs = (policy?.cooldownSeconds ?? 20) * 1000;
    if (lastWarning && now - lastWarning.createdAt.getTime() < cooldownMs) {
      return { event, warning: null, warningCount: session.warningCount };
    }
    if (session.warningCount >= (policy?.maxWarnings ?? 3)) {
      return { event, warning: null, warningCount: session.warningCount };
    }

    const sequence = SEQUENCE[session.warningCount];
    const warning = await this.prisma.$transaction(async (tx) => {
      const created = await tx.warningEvent.create({
        data: {
          sessionId,
          sequence,
          eventType: input.type,
          reason: this.reasonFor(input.type, sequence),
          staffNotified: sequence !== WarningSequence.FIRST,
        },
      });
      await tx.examSession.update({
        where: { id: sessionId },
        data: { warningCount: { increment: 1 } },
      });
      if (sequence === WarningSequence.THIRD) {
        await tx.examSession.update({
          where: { id: sessionId },
          data: { status: SessionStatus.VOIDED },
        });
        await tx.user.update({
          where: { id: studentId },
          data: { status: UserStatus.SUSPENDED },
        });
        await tx.incident.create({
          data: {
            sessionId,
            summary: `Third warning reached: ${input.type}. Candidate automatically terminated, session voided, and user access suspended.`,
          },
        });
      }
      return created;
    });

    const examId = session.examRun.examId;
    this.realtime.warningRaised(examId, {
      sessionId,
      studentId,
      sequence,
      type: input.type,
      warningCount: session.warningCount + 1,
    });
    await this.audit.record({
      action: "WARNING_RAISED",
      entity: "ExamSession",
      entityId: sessionId,
      metadata: { sequence, type: input.type },
    });

    return { event, warning, warningCount: session.warningCount + 1 };
  }

  warnings(sessionId: string) {
    return this.prisma.warningEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
  }

  incidents() {
    return this.prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      include: { session: true },
    });
  }

  private reasonFor(type: string, sequence: WarningSequence) {
    const map: Record<string, string> = {
      FACE_MISSING: "Your face was not visible in the camera for a sustained period.",
      MULTIPLE_FACES: "More than one person appeared in the camera view.",
      GAZE_AWAY: "Repeated looking away from the examination area was detected.",
      PHONE_DETECTED: "A phone-like object appeared in the camera frame.",
      IDENTITY_MISMATCH: "The visible face did not match the enrolled candidate.",
      TAB_BLUR: "The exam window lost focus.",
      FULLSCREEN_EXIT: "The secure exam view was left.",
    };
    const prefix =
      sequence === WarningSequence.FIRST
        ? "Warning 1 of 3"
        : sequence === WarningSequence.SECOND
          ? "Warning 2 of 3 — staff have been notified"
          : "Warning 3 of 3 — this session is flagged for review";
    return `${prefix}: ${map[type] ?? type}. This is not an automatic fail.`;
  }
}
