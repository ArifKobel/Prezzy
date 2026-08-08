import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { env } from "@/config/env";
import { multerOptions } from "@/files/multer-options";

@Controller("files")
export class FilesController {
  @Post()
  @HttpCode(201)
  @UseInterceptors(FileInterceptor("file", multerOptions))
  upload(@UploadedFile() file?: Express.Multer.File): { url: string } {
    if (!file) throw new BadRequestException("File is required");
    return { url: `${env.publicUrl}/uploads/${file.filename}` };
  }
}
