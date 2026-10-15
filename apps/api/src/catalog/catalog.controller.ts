import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { AssessmentKind, QuestionType, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser, JwtAuthGuard, Roles, type AuthUser } from "../common/auth";
import { AuditService } from "../audit/audit.service";

class CreateQuestionDto {
  @IsString()
  bankId!: string;
  @IsEnum(QuestionType)
  type!: QuestionType;
  @IsString()
  stem!: string;
  @IsNumber()
  marks!: number;
  @IsNumber()
  negativeMarks!: number;
  @IsArray()
  options!: { label: string; text: string; isCorrect: boolean }[];
}

class CreateExamDto {
  @IsString()
  title!: string;
  @IsEnum(AssessmentKind)
  kind!: AssessmentKind;
  @IsOptional()
  @IsString()
  description?: string;
  @IsInt()
  @Min(1)
  durationMinutes!: number;
}

class AddSectionDto {
  @IsString()
  title!: string;
  @IsEnum(AssessmentKind)
  kind!: AssessmentKind;
  @IsArray()
  questionIds!: string[];
}

class AssignDto {
  @IsString()
  examId!: string;
  @IsArray()
  studentIds!: string[];
  @IsOptional()
  @IsArray()
  staffProfileIds?: string[];
}

@Controller()
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get("questions")
  @Roles(Role.MASTER_ADMIN, Role.STAFF)
  questions() {
    return this.prisma.question.findMany({
      include: { options: true, bank: true },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post("questions")
  @Roles(Role.MASTER_ADMIN)
  async createQuestion(@Body() body: CreateQuestionDto, @CurrentUser() actor: AuthUser) {
    const question = await this.prisma.question.create({
      data: {
        bankId: body.bankId,
        type: body.type,
        stem: body.stem,
        marks: body.marks,
        negativeMarks: body.negativeMarks,
        options: { create: body.options },
      },
      include: { options: true },
    });
    await this.prisma.questionVersion.create({
      data: { questionId: question.id, snapshot: question as object },
    });
    await this.audit.record({
      actorId: actor.id,
      action: "QUESTION_CREATE",
      entity: "Question",
      entityId: question.id,
    });
    return question;
  }

  @Get("exams")
  @Roles(Role.MASTER_ADMIN, Role.STAFF)
  exams(@CurrentUser() user: AuthUser) {
    if (user.role === Role.STAFF) {
      return this.prisma.exam.findMany({
        where: { staffAssignments: { some: { staffProfile: { userId: user.id } } } },
        include: { sections: true, runs: true, warningPolicy: true },
        orderBy: { createdAt: "desc" },
      });
    }
    return this.prisma.exam.findMany({
      include: {
        sections: { include: { questions: true } },
        runs: true,
        warningPolicy: true,
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post("exams")
  @Roles(Role.MASTER_ADMIN)
  async createExam(@Body() body: CreateExamDto, @CurrentUser() actor: AuthUser) {
    const exam = await this.prisma.exam.create({
      data: {
        title: body.title,
        kind: body.kind,
        description: body.description,
        durationMinutes: body.durationMinutes,
        warningPolicy: { create: {} },
        runs: { create: { status: "SCHEDULED" } },
      },
      include: { warningPolicy: true, runs: true },
    });
    await this.audit.record({
      actorId: actor.id,
      action: "EXAM_CREATE",
      entity: "Exam",
      entityId: exam.id,
    });
    return exam;
  }

  @Post("exams/:id/sections")
  @Roles(Role.MASTER_ADMIN)
  async addSection(@Param("id") id: string, @Body() body: AddSectionDto) {
    const questions = await this.prisma.question.findMany({
      where: { id: { in: body.questionIds } },
    });
    return this.prisma.examSection.create({
      data: {
        examId: id,
        title: body.title,
        kind: body.kind,
        order: 0,
        questions: {
          create: questions.map((q, index) => ({
            questionId: q.id,
            order: index,
            marks: q.marks,
          })),
        },
      },
      include: { questions: true },
    });
  }

  @Post("exams/:id/publish")
  @Roles(Role.MASTER_ADMIN)
  async publish(@Param("id") id: string, @CurrentUser() actor: AuthUser) {
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id },
      include: {
        sections: { include: { questions: { include: { question: { include: { options: true } } } } } },
        warningPolicy: true,
      },
    });
    const frozen = {
      title: exam.title,
      durationMinutes: exam.durationMinutes,
      sections: exam.sections,
      warningPolicy: exam.warningPolicy,
      publishedAt: new Date().toISOString(),
    };
    const updated = await this.prisma.exam.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        frozenConfig: frozen as object,
        warningPolicy: { update: { locked: true } },
      },
    });
    await this.audit.record({
      actorId: actor.id,
      action: "EXAM_PUBLISH",
      entity: "Exam",
      entityId: id,
    });
    return updated;
  }

  @Post("assignments")
  @Roles(Role.MASTER_ADMIN)
  async assign(@Body() body: AssignDto, @CurrentUser() actor: AuthUser) {
    await this.prisma.$transaction([
      ...body.studentIds.map((studentId) =>
        this.prisma.examAssignment.upsert({
          where: { examId_studentId: { examId: body.examId, studentId } },
          create: { examId: body.examId, studentId },
          update: {},
        }),
      ),
      ...(body.staffProfileIds ?? []).map((staffProfileId) =>
        this.prisma.staffExamAssignment.upsert({
          where: { examId_staffProfileId: { examId: body.examId, staffProfileId } },
          create: { examId: body.examId, staffProfileId },
          update: {},
        }),
      ),
    ]);
    await this.audit.record({
      actorId: actor.id,
      action: "EXAM_ASSIGN",
      entity: "Exam",
      entityId: body.examId,
      metadata: { studentCount: body.studentIds.length },
    });
    return { ok: true };
  }

  @Get("assignments")
  @Roles(Role.MASTER_ADMIN, Role.STAFF)
  assignments() {
    return this.prisma.examAssignment.findMany({
      include: { exam: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
}
