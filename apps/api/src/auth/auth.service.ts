import { randomUUID } from "node:crypto";
import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { and, desc, eq, like, lt } from "drizzle-orm";
import { type JwtPayload, sign, verify } from "jsonwebtoken";
import { DEMO_SLIDES } from "@/auth/demo-content";
import { env } from "@/config/env";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { presentations, slideElements, slides, type UserRow, users } from "@/db/schema";
import { generateJoinCode } from "@/presentations/join-code";
import {
  DEMO_EMAIL_SUFFIX,
  DEMO_MAX_AGE_MS,
  NO_PASSWORD_LOGIN,
  PASSWORD_SALT_ROUNDS,
  SESSION_MAX_AGE_MS,
} from "@/auth/auth.constants";
import type { ChangePasswordDto } from "@/auth/dto/change-password.dto";
import type { LoginDto } from "@/auth/dto/login.dto";
import type { SignupDto } from "@/auth/dto/signup.dto";
import type { UpdateProfileDto } from "@/auth/dto/update-profile.dto";

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

  async loginWithGoogle(profile: { email: string; name: string }): Promise<UserRow> {
    const existing = await this.findByEmail(profile.email);
    if (existing) return existing;
    const [created] = await this.db
      .insert(users)
      .values({ email: profile.email, name: profile.name, passwordHash: NO_PASSWORD_LOGIN })
      .returning();
    if (!created) throw new UnauthorizedException("Could not create account");
    return created;
  }

  async existingDemo(token: string | undefined): Promise<{ user: UserRow; id: string } | null> {
    const userId = token ? this.verifyToken(token) : null;
    if (!userId) return null;
    const user = await this.findById(userId);
    if (!user?.email.endsWith(DEMO_EMAIL_SUFFIX)) return null;
    const [presentation] = await this.db
      .select({ id: presentations.id })
      .from(presentations)
      .where(eq(presentations.userId, user.id))
      .orderBy(desc(presentations.createdAt))
      .limit(1);
    return presentation ? { user, id: presentation.id } : null;
  }

  async createDemo(): Promise<{ user: UserRow; presentationId: string }> {
    void this.purgeExpiredDemos();
    const [user] = await this.db
      .insert(users)
      .values({
        email: `demo-${randomUUID()}${DEMO_EMAIL_SUFFIX}`,
        name: "Demo user",
        passwordHash: NO_PASSWORD_LOGIN,
      })
      .returning();
    if (!user) throw new ConflictException("Could not create demo account");
    const [presentation] = await this.db
      .insert(presentations)
      .values({ userId: user.id, title: "Welcome to Prezzy", joinCode: generateJoinCode() })
      .returning();
    if (!presentation) throw new ConflictException("Could not create demo presentation");
    const created = await this.db
      .insert(slides)
      .values(
        DEMO_SLIDES.map((seed, order) => ({
          presentationId: presentation.id,
          order,
          title: seed.title,
        })),
      )
      .returning({ id: slides.id, order: slides.order });
    await this.db.insert(slideElements).values(
      created.flatMap((slide) =>
        (DEMO_SLIDES[slide.order]?.elements ?? []).map((element) => ({
          ...element,
          slideId: slide.id,
        })),
      ),
    );
    return { user, presentationId: presentation.id };
  }

  private async purgeExpiredDemos(): Promise<void> {
    const cutoff = new Date(Date.now() - DEMO_MAX_AGE_MS);
    await this.db
      .delete(users)
      .where(and(like(users.email, `demo-%${DEMO_EMAIL_SUFFIX}`), lt(users.createdAt, cutoff)))
      .catch(() => undefined);
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
