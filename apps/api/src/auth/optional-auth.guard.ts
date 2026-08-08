import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import { SESSION_COOKIE } from "@/auth/auth.constants";
import { AuthService } from "@/auth/auth.service";
import type { AuthenticatedRequest } from "@/auth/authenticated-request";
import { toUser } from "@/auth/user.serializer";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) return true;
    const userId = this.auth.verifyToken(token);
    if (!userId) return true;
    const user = await this.auth.findById(userId);
    if (user) request.user = toUser(user);
    return true;
  }
}
