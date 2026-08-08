import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { AppModule } from "@/app.module";
import { SESSION_COOKIE } from "@/auth/auth.constants";
import { AuthService } from "@/auth/auth.service";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { socketIdContext } from "@/events/socket-id-context";

export const createTestApp = async (db: Database): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DRIZZLE)
    .useValue(db)
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.use(socketIdContext);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
};

export const sessionCookie = (app: INestApplication, userId: string): string => {
  const token = app.get(AuthService).createToken(userId);
  return `${SESSION_COOKIE}=${token}`;
};
