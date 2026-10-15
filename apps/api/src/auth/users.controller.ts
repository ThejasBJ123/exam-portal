import { Body, Controller, Get, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { Role, UserStatus } from "@prisma/client";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser, JwtAuthGuard, Roles, type AuthUser } from "../common/auth";

class CreateUserDto {
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(8)
  password!: string;
  @IsString()
  fullName!: string;
  @IsEnum(Role)
  role!: Role;
  @IsOptional()
  @IsString()
  rollNumber?: string;
  @IsOptional()
  @IsString()
  phone?: string;
  @IsOptional()
  @IsString()
  designation?: string;
}

class StatusDto {
  @IsString()
  id!: string;
  @IsEnum(UserStatus)
  status!: UserStatus;
}

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles(Role.MASTER_ADMIN, Role.STAFF)
  list(@Query("role") role?: Role) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        studentProfile: true,
        staffProfile: true,
      },
    });
  }

  @Post()
  @Roles(Role.MASTER_ADMIN)
  create(@Body() body: CreateUserDto, @CurrentUser() actor: AuthUser) {
    return this.auth.createUser({ ...body, actorId: actor.id });
  }

  @Patch("status")
  @Roles(Role.MASTER_ADMIN)
  async setStatus(@Body() body: StatusDto) {
    return this.prisma.user.update({
      where: { id: body.id },
      data: { status: body.status },
    });
  }
}
