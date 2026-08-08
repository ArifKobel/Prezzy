import { Module } from "@nestjs/common";
import { FilesController } from "@/files/files.controller";

@Module({
  controllers: [FilesController],
})
export class FilesModule {}
