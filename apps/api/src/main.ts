import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { AppModule } from "@/app.module";
import { env } from "@/config/env";
import { socketIdContext } from "@/events/socket-id-context";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.use(socketIdContext);
  app.enableCors({ origin: env.webOrigin, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(env.uploadDir, { prefix: "/uploads/" });
  await app.listen(env.port);
}

void bootstrap();
