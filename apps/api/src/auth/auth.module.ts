import { Module } from "@nestjs/common";
import { AuthController } from "@/auth/auth.controller";
import { AuthGuard } from "@/auth/auth.guard";
import { AuthService } from "@/auth/auth.service";
import { OptionalAuthGuard } from "@/auth/optional-auth.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, OptionalAuthGuard],
  exports: [AuthService, AuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
