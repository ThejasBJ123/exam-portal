import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { IsEmail, IsString, MinLength } from "class-validator";
import { Role } from "@prisma/client";
import { AuthService } from "./auth.service";
import { CurrentUser, JwtAuthGuard, Public, type AuthUser } from "../common/auth";

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class RegisterStudentDto {
  @IsString()
  fullName!: string;

  @IsString()
  phone!: string;

  @IsEmail()
  email!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setCookie(res: Response, token: string) {
    res.cookie("kgs_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });
  }

  @Public()
  @Post("student/register")
  async studentRegister(@Body() body: RegisterStudentDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.registerStudent(body);
    this.setCookie(res, result.token);
    return result;
  }

  @Public()
  @Post("student/login")
  async studentLogin(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(body.email, body.password, [Role.STUDENT]);
    this.setCookie(res, result.token);
    return result;
  }

  @Public()
  @Post("company/login")
  async companyLogin(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(body.email, body.password, [
      Role.MASTER_ADMIN,
      Role.STAFF,
    ]);
    this.setCookie(res, result.token);
    return result;
  }

  @Public()
  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("kgs_token", { path: "/" });
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
