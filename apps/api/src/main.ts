import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "@/app.module";
import { configureApp } from "@/bootstrap";
import { env } from "@/config/env";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  app.enableCors({ origin: env.webOrigin, credentials: true });
  app.useStaticAssets(env.uploadDir, { prefix: "/uploads/" });
  await app.listen(env.port);
}

void bootstrap();
