import { randomUUID } from "node:crypto";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthGuard } from "@/auth/auth.guard";
import { AuthService } from "@/auth/auth.service";
import { CurrentUser } from "@/auth/current-user.decorator";
import { ChangePasswordDto } from "@/auth/dto/change-password.dto";
import { LoginDto } from "@/auth/dto/login.dto";
import { SignupDto } from "@/auth/dto/signup.dto";
import { UpdateProfileDto } from "@/auth/dto/update-profile.dto";
import { OptionalAuthGuard } from "@/auth/optional-auth.guard";
import { fetchGoogleProfile, googleAuthUrl } from "@/auth/google";
import { clearSessionCookie, setSessionCookie } from "@/auth/session-cookie";
import { toUser } from "@/auth/user.serializer";
import { env } from "@/config/env";
import type { User } from "@/shared";

const OAUTH_STATE_COOKIE = "prezzy_oauth_state";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response): Promise<User> {
    const user = await this.auth.signup(dto);
    setSessionCookie(res, this.auth.createToken(user.id));
    return toUser(user);
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<User> {
    const user = await this.auth.login(dto);
    setSessionCookie(res, this.auth.createToken(user.id));
    return toUser(user);
  }

  @Get("google")
  googleStart(@Res() res: Response): void {
    if (!env.googleClientId) throw new NotFoundException();
    const state = randomUUID();
    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.publicUrl.startsWith("https"),
      maxAge: 10 * 60 * 1000,
      path: "/api/auth/google",
    });
    res.redirect(googleAuthUrl(state));
  }

  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const expectedState = (req.cookies as Record<string, string>)[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/api/auth/google" });
    try {
      if (!code || !state || state !== expectedState) throw new Error("Invalid OAuth state");
      const user = await this.auth.loginWithGoogle(await fetchGoogleProfile(code));
      setSessionCookie(res, this.auth.createToken(user.id));
      res.redirect(`${env.webOrigin}/dashboard`);
    } catch {
      res.redirect(`${env.webOrigin}/login?error=google`);
    }
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response): { success: boolean } {
    clearSessionCookie(res);
    return { success: true };
  }

  @Get("me")
  @UseGuards(OptionalAuthGuard)
  me(@CurrentUser() user: User | undefined): User | null {
    return user ?? null;
  }

  @Patch("profile")
  @UseGuards(AuthGuard)
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto): Promise<User> {
    return toUser(await this.auth.updateProfile(user.id, dto));
  }

  @Post("change-password")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    await this.auth.changePassword(user.id, dto);
    return { success: true };
  }
}
