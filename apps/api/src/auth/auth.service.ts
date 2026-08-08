import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { type JwtPayload, sign, verify } from "jsonwebtoken";
import { env } from "../config/env";
import { DRIZZLE } from "../db/db.constants";
import type { Database } from "../db/db.types";
import { type UserRow, users } from "../db/schema";
import { PASSWORD_SALT_ROUNDS, SESSION_MAX_AGE_MS } from "./auth.constants";
import type { ChangePasswordDto } from "./dto/change-password.dto";
import type { LoginDto } from "./dto/login.dto";
import type { SignupDto } from "./dto/signup.dto";
import type { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class AuthService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async signup(dto: SignupDto): Promise<UserRow> {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException("Email already registered");
    const passwordHash = await hash(dto.password, PASSWORD_SALT_ROUNDS);
    const [created] = await this.db
      .insert(users)
      .values({ email: dto.email, name: dto.name, passwordHash })
      .returning();
    if (!created) throw new ConflictException("Could not create account");
    return created;
  }

  async login(dto: LoginDto): Promise<UserRow> {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException("Invalid email or password");
    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid email or password");
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserRow> {
    const [updated] = await this.db
      .update(users)
      .set({ name: dto.name })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new UnauthorizedException("Account not found");
    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new UnauthorizedException("Account not found");
    const valid = await compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Current password is incorrect");
    const passwordHash = await hash(dto.newPassword, PASSWORD_SALT_ROUNDS);
    await this.db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  }

  async findById(id: string): Promise<UserRow | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }

  createToken(userId: string): string {
    return sign({ sub: userId }, env.jwtSecret, { expiresIn: SESSION_MAX_AGE_MS / 1000 });
  }

  verifyToken(token: string): string | null {
    try {
      const payload = verify(token, env.jwtSecret) as JwtPayload | string;
      if (typeof payload === "string" || typeof payload.sub !== "string") return null;
      return payload.sub;
    } catch {
      return null;
    }
  }

  private async findByEmail(email: string): Promise<UserRow | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ?? null;
  }
}
