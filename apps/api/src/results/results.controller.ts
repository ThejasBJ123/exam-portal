import { BadRequestException, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CurrentUser, JwtAuthGuard, Roles, type AuthUser } from "../common/auth";

@Controller()
@UseGuards(JwtAuthGuard)
export class ResultsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get("results")
  @Roles(Role.MASTER_ADMIN, Role.STAFF)
  list() {
    return this.prisma.result.findMany({
      include: { session: { include: { score: true, examRun: { include: { exam: true } } } } },
      orderBy: { sessionId: "asc" },
    });
  }

  @Post("results/:id/approve")
  @Roles(Role.MASTER_ADMIN)
  async approve(@Param("id") id: string, @CurrentUser() actor: AuthUser) {
    const result = await this.prisma.result.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviews: { create: { reviewerId: actor.id, notes: "Approved for publication" } },
      },
    });
    await this.audit.record({
      actorId: actor.id,
      action: "RESULT_APPROVE",
      entity: "Result",
      entityId: id,
    });
    return result;
  }

  @Post("results/:id/publish")
  @Roles(Role.MASTER_ADMIN)
  async publish(@Param("id") id: string, @CurrentUser() actor: AuthUser) {
    const existing = await this.prisma.result.findUniqueOrThrow({ where: { id } });
    if (existing.status !== "APPROVED" && existing.status !== "PUBLISHED") {
      throw new BadRequestException("Results must be approved before publication");
    }
    const result = await this.prisma.result.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publication: {
          upsert: {
            create: { approvedBy: actor.id },
            update: { approvedBy: actor.id, publishedAt: new Date() },
          },
        },
      },
    });
    await this.audit.record({
      actorId: actor.id,
      action: "RESULT_PUBLISH",
      entity: "Result",
      entityId: id,
    });
    return result;
  }

  @Get("student/results/:sessionId")
  @Roles(Role.STUDENT)
  async studentResult(@Param("sessionId") sessionId: string, @CurrentUser() user: AuthUser) {
    const result = await this.prisma.result.findUnique({
      where: { sessionId },
      include: { session: { include: { score: true, examRun: { include: { exam: true } } } } },
    });
    if (!result || result.session.studentId !== user.id) return { available: false };
    if (result.status !== "PUBLISHED") return { available: false, status: result.status };
    return { available: true, result };
  }

  @Get("audit-logs")
  @Roles(Role.MASTER_ADMIN)
  logs() {
    return this.audit.list();
  }

  @Get("dashboard")
  @Roles(Role.MASTER_ADMIN, Role.STAFF)
  async dashboard() {
    const [users, exams, live, incidents] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.exam.count(),
      this.prisma.examSession.count({ where: { status: "IN_PROGRESS" } }),
      this.prisma.incident.count({ where: { status: "OPEN" } }),
    ]);
    return { users, exams, live, incidents };
  }
}
