import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module";
import { SESSION_COOKIE } from "@/auth/auth.constants";
import { AuthService } from "@/auth/auth.service";
import { configureApp } from "@/bootstrap";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";

export const createTestApp = async (db: Database): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DRIZZLE)
    .useValue(db)
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  return app;
};

export const sessionCookie = (app: INestApplication, userId: string): string => {
  const token = app.get(AuthService).createToken(userId);
  return `${SESSION_COOKIE}=${token}`;
};
