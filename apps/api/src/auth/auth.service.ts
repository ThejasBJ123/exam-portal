import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { Role, UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../common/auth";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, expected?: Role[]) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { studentProfile: true },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        "Access Revoked: Candidate was TERMINATED and EXITED due to reaching 3 proctoring warnings (3/3). You cannot log in once again for the exam using this email ID or phone number."
      );
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Account is not active.");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    if (expected && !expected.includes(user.role)) {
      throw new UnauthorizedException("Use the correct portal for this account");
    }
    const payload: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
    const token = await this.jwt.signAsync(payload);
    await this.audit.record({
      actorId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
    });
    return { token, user: payload };
  }

  async createUser(input: {
    email: string;
    password: string;
    fullName: string;
    role: Role;
    actorId?: string;
    batchId?: string;
    rollNumber?: string;
    designation?: string;
  }) {
    const exists = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (exists) throw new BadRequestException("Email already in use");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        fullName: input.fullName,
        role: input.role,
        studentProfile:
          input.role === Role.STUDENT
            ? { create: { batchId: input.batchId, rollNumber: input.rollNumber } }
            : undefined,
        staffProfile:
          input.role === Role.STAFF || input.role === Role.MASTER_ADMIN
            ? { create: { designation: input.designation ?? input.role } }
            : undefined,
      },
      include: { studentProfile: true, staffProfile: true },
    });
    await this.audit.record({
      actorId: input.actorId,
      action: "USER_CREATE",
      entity: "User",
      entityId: user.id,
      metadata: { role: user.role, email: user.email },
    });
    return user;
  }

  async registerStudent(input: {
    fullName: string;
    phone: string;
    email: string;
    password?: string;
  }) {
    const cleanEmail = input.email.toLowerCase().trim();
    const cleanPhone = input.phone.trim();

    const existsEmail = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { studentProfile: true },
    });
    if (existsEmail) {
      if (existsEmail.status === UserStatus.SUSPENDED) {
        throw new BadRequestException(
          `Candidate with email '${cleanEmail}' was TERMINATED and EXITED due to 3 warnings. Re-registration or retaking this exam is prohibited.`
        );
      }
      throw new BadRequestException(`Email '${cleanEmail}' is already registered`);
    }

    const existsPhone = await this.prisma.studentProfile.findFirst({
      where: { phone: cleanPhone },
      include: { user: true },
    });
    if (existsPhone) {
      if (existsPhone.user?.status === UserStatus.SUSPENDED) {
        throw new BadRequestException(
          `Candidate with mobile number '${cleanPhone}' was TERMINATED and EXITED due to 3 warnings. Re-registration or retaking this exam is prohibited.`
        );
      }
      throw new BadRequestException(`Mobile number '${cleanPhone}' is already registered. Mobile numbers must be unique.`);
    }

    const count = await this.prisma.studentProfile.count();
    const rollNumber = `KGS-2026-${String(count + 1).padStart(3, "0")}`;
    const password = input.password ?? "ChangeMe_123";
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        fullName: input.fullName.trim(),
        role: Role.STUDENT,
        studentProfile: {
          create: {
            phone: cleanPhone,
            rollNumber,
          },
        },
      },
      include: { studentProfile: true },
    });

    const payload: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
    const token = await this.jwt.signAsync(payload);
    await this.audit.record({
      actorId: user.id,
      action: "STUDENT_INTAKE_REGISTER",
      entity: "User",
      entityId: user.id,
      metadata: { phone: cleanPhone, rollNumber },
    });
    return { token, user: payload, studentProfile: user.studentProfile };
  }
}
