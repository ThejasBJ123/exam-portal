import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { Role } from "@prisma/client";
import { EngineService } from "./engine.service";
import { CurrentUser, JwtAuthGuard, Roles, type AuthUser } from "../common/auth";

class AnswerDto {
  @IsString()
  questionId!: string;
  payload!: unknown;
}

class ConsentDto {
  @IsString()
  policyText!: string;
}

class SubmitDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class EngineController {
  constructor(private readonly engine: EngineService) {}

  @Get("student/exams")
  @Roles(Role.STUDENT)
  mine(@CurrentUser() user: AuthUser) {
    return this.engine.studentExams(user.id);
  }

  @Get("student/exams/:examId")
  @Roles(Role.STUDENT)
  details(@Param("examId") examId: string, @CurrentUser() user: AuthUser) {
    return this.engine.getOrCreateSession(examId, user.id);
  }

  @Post("exam-sessions/:id/readiness")
  @Roles(Role.STUDENT)
  ready(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.engine.markReady(id, user.id);
  }

  @Post("exam-sessions/:id/consent")
  @Roles(Role.STUDENT)
  consent(@Param("id") id: string, @Body() body: ConsentDto, @CurrentUser() user: AuthUser) {
    return this.engine.consent(id, user.id, body.policyText);
  }

  @Post("exams/:id/start")
  @Roles(Role.MASTER_ADMIN, Role.STAFF)
  start(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.engine.staffStart(id, user);
  }

  @Post("exam-sessions/:id/begin")
  @Roles(Role.STUDENT)
  begin(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.engine.beginAttempt(id, user.id);
  }

  @Post("exam-sessions/:id/answers")
  @Roles(Role.STUDENT)
  save(@Param("id") id: string, @Body() body: AnswerDto, @CurrentUser() user: AuthUser) {
    return this.engine.saveAnswer(id, user.id, body.questionId, body.payload);
  }

  @Post("exam-sessions/:id/submit")
  @Roles(Role.STUDENT)
  submit(@Param("id") id: string, @Body() body: SubmitDto, @CurrentUser() user: AuthUser) {
    return this.engine.submit(id, user.id, body.reason ?? "STUDENT");
  }

  @Get("exams/:id/lobby")
  @Roles(Role.MASTER_ADMIN, Role.STAFF)
  lobby(@Param("id") id: string) {
    return this.engine.lobby(id);
  }
}
