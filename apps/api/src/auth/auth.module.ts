import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-only-change-me",
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? "8h") as any },
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [AuthService],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
