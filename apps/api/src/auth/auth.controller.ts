import { Body, Controller, Get, HttpCode, Patch, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { OptionalAuthGuard } from "./optional-auth.guard";
import { clearSessionCookie, setSessionCookie } from "./session-cookie";
import { toUser } from "./user.serializer";
import type { User } from "../shared";

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
