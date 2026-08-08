import { BadRequestException } from "@nestjs/common";
import type { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname } from "node:path";
import { diskStorage } from "multer";
import { env } from "@/config/env";

mkdirSync(env.uploadDir, { recursive: true });

export const multerOptions: MulterOptions = {
  storage: diskStorage({
    destination: env.uploadDir,
    filename: (_request, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new BadRequestException("Only image uploads are allowed"), false);
      return;
    }
    callback(null, true);
  },
};
