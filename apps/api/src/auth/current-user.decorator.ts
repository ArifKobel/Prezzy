import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest } from "@/auth/authenticated-request";
import type { User } from "@/shared";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
