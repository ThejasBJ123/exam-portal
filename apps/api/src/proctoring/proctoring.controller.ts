import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Role } from "@prisma/client";
import { PROCTORING_EVENT_TYPES, type ProctoringEventType } from "@kgs/shared";
import { ProctoringService } from "./proctoring.service";
import { CurrentUser, JwtAuthGuard, Roles, type AuthUser } from "../common/auth";

class EventDto {
  @IsEnum(PROCTORING_EVENT_TYPES)
  type!: ProctoringEventType;
  @IsOptional()
  @IsNumber()
  confidence?: number;
  @IsOptional()
  @IsString()
  detectorVersion?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ProctoringController {
  constructor(private readonly proctoring: ProctoringService) {}

  @Post("exam-sessions/:id/proctoring-events")
  @Roles(Role.STUDENT)
  ingest(@Param("id") id: string, @Body() body: EventDto, @CurrentUser() user: AuthUser) {
    return this.proctoring.ingest(id, user.id, body);
  }

  @Get("exam-sessions/:id/warnings")
  warnings(@Param("id") id: string) {
    return this.proctoring.warnings(id);
  }

  @Get("incidents")
  @Roles(Role.MASTER_ADMIN, Role.STAFF)
  incidents() {
    return this.proctoring.incidents();
  }
}
