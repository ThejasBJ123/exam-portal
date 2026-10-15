import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { PrismaService } from "./prisma/prisma.service";
import { AuditService } from "./audit/audit.service";
import { JwtAuthGuard } from "./common/auth";
import { AuthModule } from "./auth/auth.module";
import { CatalogController } from "./catalog/catalog.controller";
import { EngineService } from "./engine/engine.service";
import { EngineController } from "./engine/engine.controller";
import { ProctoringService } from "./proctoring/proctoring.service";
import { ProctoringController } from "./proctoring/proctoring.controller";
import { ResultsController } from "./results/results.controller";
import { RealtimeGateway } from "./realtime/realtime.gateway";

@Global()
@Module({
  providers: [PrismaService, AuditService],
  exports: [PrismaService, AuditService],
})
class CoreModule {}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }), CoreModule, AuthModule],
  controllers: [CatalogController, EngineController, ProctoringController, ResultsController],
  providers: [
    EngineService,
    ProctoringService,
    RealtimeGateway,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
