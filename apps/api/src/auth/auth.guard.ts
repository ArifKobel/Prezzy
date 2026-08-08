import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { SESSION_COOKIE } from "./auth.constants";
import { AuthService } from "./auth.service";
import type { AuthenticatedRequest } from "./authenticated-request";
import { toUser } from "./user.serializer";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException();
    const userId = this.auth.verifyToken(token);
    if (!userId) throw new UnauthorizedException();
    const user = await this.auth.findById(userId);
    if (!user) throw new UnauthorizedException();
    request.user = toUser(user);
    return true;
  }
}
